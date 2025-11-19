import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// express app
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Setting up database
const dbPath = join(__dirname, "users.db");
const db = new Database(dbPath);

// Creating tables (if not exists)
db.prepare(`
    CREATE TABLE IF NOT EXISTS managers (
        manager_id TEXT PRIMARY KEY,
        is_active INTEGER DEFAULT 1
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        full_name TEXT,
        mob_num TEXT,
        pan_num TEXT,
        manager_id TEXT,
        created_at TEXT,
        updated_at TEXT,
        is_active INTEGER DEFAULT 1
    )
`).run();

// Insert sample managers only when table is empty
const managerCheck = db.prepare("SELECT COUNT(*) AS total FROM managers").get();
if (managerCheck.total === 0) {
    const sampleManagers = [uuidv4(), uuidv4(), uuidv4()];
    for (let id of sampleManagers) {
        db.prepare("INSERT INTO managers (manager_id, is_active) VALUES (?, 1)").run(id);
    }
}

// Validation functions
function checkMobile(number) {
    if (!number) return null;

    // removing +91 or 0
    if (number.startsWith("+91")) number = number.slice(3);
    if (number.startsWith("0")) number = number.slice(1);

    if (number.length === 10 && /^[0-9]+$/.test(number)) {
        return number;
    } else {
        return null;
    }
}

function checkPAN(pan) {
    if (!pan) return null;

    const newPan = pan.toUpperCase();
    const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (pattern.test(newPan)) {
        return newPan;
    } else {
        return null;
    }
}

function managerIsActive(id) {
    const row = db.prepare("SELECT * FROM managers WHERE manager_id=? AND is_active=1").get(id);

    if (row) return true;
    return false;
}


// CREATE USER API
app.post("/create_user", (req, res) => {
    try {
        const { full_name, mob_num, pan_num, manager_id } = req.body;

        if (!full_name || !mob_num || !pan_num || !manager_id) {
            return res.status(400).json({ error: "Please fill all fields" });
        }

        if (!managerIsActive(manager_id)) {
            return res.status(400).json({ error: "Manager is not active" });
        }

        const cleanMobile = checkMobile(mob_num);
        if (!cleanMobile) {
            return res.status(400).json({ error: "Invalid mobile number" });
        }

        const cleanPAN = checkPAN(pan_num);
        if (!cleanPAN) {
            return res.status(400).json({ error: "Invalid PAN number" });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).run(id, full_name, cleanMobile, cleanPAN, manager_id, now, now);

        res.json({ message: "User created successfully", user_id: id });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});


// GET USERS
app.post("/get_users", (req, res) => {
    try {
        const { user_id, mob_num, manager_id } = req.body;

        let result = [];

        if (user_id) {
            result = db.prepare("SELECT * FROM users WHERE user_id=? AND is_active=1").all(user_id);
        } else if (mob_num) {
            const cleanMobile = checkMobile(mob_num);
            result = db.prepare("SELECT * FROM users WHERE mob_num=? AND is_active=1").all(cleanMobile);
        } else if (manager_id) {
            result = db.prepare("SELECT * FROM users WHERE manager_id=? AND is_active=1").all(manager_id);
        } else {
            result = db.prepare("SELECT * FROM users WHERE is_active=1").all();
        }

        res.json({ users: result });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});


// UPDATE USER

app.post("/update_user", (req, res) => {
    try {
        const { user_ids, update_data } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ error: "Invalid user_ids" });
        }

        if (!update_data) {
            return res.status(400).json({ error: "No update data provided" });
        }

        const now = new Date().toISOString();

        for (let id of user_ids) {
            const user = db.prepare("SELECT * FROM users WHERE user_id=?").get(id);

            if (!user) continue;

            let newName = update_data.full_name || user.full_name;
            let newMob = update_data.mob_num
                ? checkMobile(update_data.mob_num)
                : user.mob_num;
            let newPan = update_data.pan_num
                ? checkPAN(update_data.pan_num)
                : user.pan_num;

            if (!newMob) return res.status(400).json({ error: "Invalid mobile" });
            if (!newPan) return res.status(400).json({ error: "Invalid PAN" });

            if (update_data.manager_id) {
                if (!managerIsActive(update_data.manager_id)) {
                    return res.status(400).json({ error: "Manager inactive" });
                }

                // mark old entry inactive
                db.prepare("UPDATE users SET is_active=0 WHERE user_id=?").run(id);

                // create new entry
                const newId = uuidv4();
                db.prepare(`
                    INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `).run(newId, newName, newMob, newPan, update_data.manager_id, user.created_at, now);

                continue;
            }

            db.prepare(`
                UPDATE users
                SET full_name=?, mob_num=?, pan_num=?, updated_at=?
                WHERE user_id=?
            `).run(newName, newMob, newPan, now, id);
        }

        res.json({ message: "Update completed" });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});


// DELETE USER
app.post("/delete_user", (req, res) => {
    try {
        const { user_id, mob_num } = req.body;

        if (!user_id && !mob_num) {
            return res.status(400).json({ error: "Provide user_id or mob_num" });
        }

        let user;

        if (user_id) {
            user = db.prepare("SELECT * FROM users WHERE user_id=?").get(user_id);
        } else {
            const cleanMobile = checkMobile(mob_num);
            user = db.prepare("SELECT * FROM users WHERE mob_num=?").get(cleanMobile);
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        db.prepare("DELETE FROM users WHERE user_id=?").run(user.user_id);

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/", (req, res) => {
    try {
        res.json({
            status: "ok",
            message: "Server is running fine",
            time: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
});


// SERVER START
app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
});
