const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Trust proxy for deployment environments
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for development
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Rate limiting with better configuration for deployment
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});
app.use('/api/', limiter);

// Database setup with permanent storage support
let dbPath;
let db;

// Determine database path based on environment
if (process.env.NODE_ENV === 'production') {
    // Production: Use persistent storage paths
    if (process.env.DATABASE_PATH) {
        dbPath = process.env.DATABASE_PATH;
    } else if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        // Railway persistent storage
        dbPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'karamchedu_survey.db');
    } else if (process.env.RENDER_VOLUME_PATH) {
        // Render persistent storage
        dbPath = path.join(process.env.RENDER_VOLUME_PATH, 'karamchedu_survey.db');
    } else {
        // Fallback to /tmp for other platforms
        dbPath = '/tmp/karamchedu_survey.db';
    }
} else {
    // Development: Use local path
    dbPath = path.join(__dirname, 'karamchedu_survey.db');
}

console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Database path: ${dbPath}`);

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!require('fs').existsSync(dbDir)) {
    require('fs').mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created database directory: ${dbDir}`);
}

db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        console.error('📁 Database path:', dbPath);
        console.error('📂 Current directory:', __dirname);
        
        // Try fallback path
        const fallbackPath = path.join(__dirname, 'karamchedu_survey.db');
        console.log(`🔄 Trying fallback path: ${fallbackPath}`);
        
        db = new sqlite3.Database(fallbackPath, (fallbackErr) => {
            if (fallbackErr) {
                console.error('❌ Fallback database also failed:', fallbackErr.message);
            } else {
                console.log(`✅ Connected to fallback database at: ${fallbackPath}`);
                initDatabase();
            }
        });
    } else {
        console.log(`✅ Connected to SQLite database at: ${dbPath}`);
        try {
            const stats = require('fs').statSync(dbPath);
            console.log(`📁 Database file permissions: ${stats.mode}`);
            console.log(`📊 Database file size: ${(stats.size / 1024).toFixed(2)} KB`);
        } catch (e) {
            console.log('📁 Could not get database file info');
        }
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    db.serialize(() => {
        // Surveys table
        db.run(`CREATE TABLE IF NOT EXISTS surveys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            date TEXT NOT NULL,
            headName TEXT,
            address TEXT,
            phone TEXT,
            familyMembers INTEGER,
            caste TEXT,
            profession TEXT,
            monthlyIncome TEXT,
            childrenCount INTEGER,
            allEnrolled TEXT,
            notEnrolledReason TEXT,
            privateSchool TEXT,
            tuition TEXT,
            costPerYear TEXT,
            needScholarship TEXT,
            digitalDevices TEXT,
            specialNeeds TEXT,
            chronicIllness TEXT,
            illnessDetails TEXT,
            healthSchemes TEXT,
            healthInsurance TEXT,
            lifeInsurance TEXT,
            cleanWater TEXT,
            sanitation TEXT,
            elderlyCount INTEGER,
            oldAgePension TEXT,
            medicalAssistance TEXT,
            dailyAssistance TEXT,
            foodDelivery TEXT,
            payForFood TEXT,
            takeIfFree TEXT,
            medicineDelivery TEXT,
            hospitalVisits TEXT,
            bpCheck TEXT,
            otherSchemes TEXT,
            comments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Users table for future authentication
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'surveyor',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log('✅ Database tables initialized');
    });
}

// API Routes

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all surveys
app.get('/api/surveys', (req, res) => {
    const query = `
        SELECT * FROM surveys 
        ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Submit new survey
app.post('/api/surveys', (req, res) => {
    const survey = req.body;
    
    // Validate required fields
    if (!survey.headName || !survey.phone || !survey.familyMembers) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate phone number
    db.get('SELECT id FROM surveys WHERE phone = ?', [survey.phone], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (row) {
            return res.status(409).json({ error: 'Survey already exists for this phone number' });
        }

        // Insert new survey
        const query = `
            INSERT INTO surveys (
                timestamp, date, headName, address, phone, familyMembers, 
                caste, profession, monthlyIncome, childrenCount, allEnrolled, notEnrolledReason,
                privateSchool, tuition, costPerYear, needScholarship, digitalDevices, specialNeeds, chronicIllness,
                illnessDetails, healthSchemes, healthInsurance, lifeInsurance, cleanWater, sanitation, elderlyCount,
                oldAgePension, medicalAssistance, dailyAssistance, foodDelivery, payForFood, takeIfFree, medicineDelivery,
                hospitalVisits, bpCheck, otherSchemes, comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            survey.timestamp || new Date().toISOString(),
            survey.date || new Date().toLocaleDateString('en-IN'),
            survey.headName,
            survey.address,
            survey.phone,
            survey.familyMembers,
            survey.caste,
            survey.profession,
            survey.monthlyIncome,
            survey.childrenCount,
            survey.allEnrolled,
            survey.notEnrolledReason,
            survey.privateSchool,
            survey.tuition,
            survey.costPerYear,
            survey.needScholarship,
            survey.digitalDevices,
            survey.specialNeeds,
            survey.chronicIllness,
            survey.illnessDetails,
            survey.healthSchemes,
            survey.healthInsurance,
            survey.lifeInsurance,
            survey.cleanWater,
            survey.sanitation,
            survey.elderlyCount,
            survey.oldAgePension,
            survey.medicalAssistance,
            survey.dailyAssistance,
            survey.foodDelivery,
            survey.payForFood,
            survey.takeIfFree,
            survey.medicineDelivery,
            survey.hospitalVisits,
            survey.bpCheck,
            survey.otherSchemes,
            survey.comments
        ];

        db.run(query, params, function(err) {
            if (err) {
                console.error('Database insert error:', err);
                console.error('Survey data:', JSON.stringify(survey, null, 2));
                res.status(500).json({ error: err.message });
                return;
            }

            console.log(`✅ Survey inserted successfully with ID: ${this.lastID}`);

            // Get the inserted survey
            db.get('SELECT * FROM surveys WHERE id = ?', [this.lastID], (err, row) => {
                if (err) {
                    console.error('Error fetching inserted survey:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }

                console.log(`📊 Survey data retrieved:`, row);

                // Emit to all connected clients
                io.emit('newSurvey', row);
                
                res.status(201).json({
                    success: true,
                    message: 'Survey submitted successfully',
                    survey: row
                });
            });
        });
    });
});

// Get a single survey by ID
app.get('/api/surveys/:id', (req, res) => {
    db.get('SELECT * FROM surveys WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Survey not found' });
            return;
        }
        res.json(row);
    });
});

// Delete a survey by ID
app.delete('/api/surveys/:id', (req, res) => {
    const surveyId = req.params.id;
    
    // First check if survey exists
    db.get('SELECT * FROM surveys WHERE id = ?', [surveyId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Delete the survey
        db.run('DELETE FROM surveys WHERE id = ?', [surveyId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Emit to all connected clients that a survey was deleted
            io.emit('surveyDeleted', { id: surveyId, survey: row });
            
            res.json({
                success: true,
                message: 'Survey deleted successfully',
                deletedSurvey: row
            });
        });
    });
});

// Get survey statistics
app.get('/api/stats', (req, res) => {
    const stats = {};
    
    // Total responses
    db.get('SELECT COUNT(*) as count FROM surveys', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        stats.totalResponses = row.count;
        
        // Education needs
        db.get('SELECT COUNT(*) as count FROM surveys WHERE needScholarship = "Yes"', [], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            stats.educationNeeds = row.count;
            
            // Health needs
            db.get('SELECT COUNT(*) as count FROM surveys WHERE healthInsurance = "Yes" OR chronicIllness = "Yes"', [], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                stats.healthNeeds = row.count;
                
                // Elder care needs
                db.get('SELECT COUNT(*) as count FROM surveys WHERE medicalAssistance = "Yes" OR dailyAssistance = "Yes"', [], (err, row) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    stats.elderCareNeeds = row.count;
                    
                    res.json(stats);
                });
            });
        });
    });
});

// Export data as CSV
app.get('/api/export/csv', (req, res) => {
    db.all('SELECT * FROM surveys ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No data to export' });
        }
        
        // Convert to CSV
        const headers = Object.keys(rows[0]).join(',');
        const csvData = rows.map(row => 
            Object.values(row).map(value => 
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
        ).join('\n');
        
        const csv = `${headers}\n${csvData}`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="karamchedu_survey_data.csv"');
        res.send(csv);
    });
});

// Backup database
app.get('/api/backup', (req, res) => {
    const backupPath = path.join(__dirname, 'backup', `karamchedu_survey_backup_${Date.now()}.db`);
    
    // Create backup directory if it doesn't exist
    const backupDir = path.dirname(backupPath);
    if (!require('fs').existsSync(backupDir)) {
        require('fs').mkdirSync(backupDir, { recursive: true });
    }
    
    // Create backup
    const backup = new sqlite3.Database(backupPath);
    db.backup(backup)
        .then(() => {
            backup.close();
            res.json({ 
                success: true, 
                message: 'Database backed up successfully',
                backupPath: backupPath,
                timestamp: new Date().toISOString()
            });
        })
        .catch(err => {
            backup.close();
            res.status(500).json({ error: err.message });
        });
});

// Get database info
app.get('/api/database-info', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM surveys', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        try {
            const stats = require('fs').statSync(dbPath);
            res.json({
                surveyCount: row.count,
                databasePath: dbPath,
                fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
                lastModified: stats.mtime,
                environment: process.env.NODE_ENV || 'development'
            });
        } catch (e) {
            res.json({
                surveyCount: row.count,
                databasePath: dbPath,
                environment: process.env.NODE_ENV || 'development'
            });
        }
    });
});

// Health check with database verification
app.get('/api/health', (req, res) => {
    // Test database connectivity
    db.get('SELECT COUNT(*) as count FROM surveys', [], (err, row) => {
        if (err) {
            console.error('Database health check failed:', err);
            return res.status(500).json({ 
                status: 'error', 
                timestamp: new Date().toISOString(),
                database: 'disconnected',
                error: err.message
            });
        }
        
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: 'connected',
            surveyCount: row.count,
            dbPath: dbPath
        });
    });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`🚀 Karamchedu Survey Backend running on port ${PORT}`);
    console.log(`📊 Database: SQLite (karamchedu_survey.db)`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    
    if (process.env.NODE_ENV === 'production') {
        console.log(`🌍 Production mode: App is globally accessible`);
    } else {
        console.log(`🏠 Local mode: Access from same network at http://192.168.86.215:${PORT}`);
    }
}); 