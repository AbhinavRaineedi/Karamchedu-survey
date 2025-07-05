# Karamchedu Village Survey - Government Schemes Support

A comprehensive survey application designed to support BPL (Below Poverty Line) families in Karamchedu village by identifying their needs for various government schemes.

## Features

- **Household Information Collection**: Basic family details, contact information, and BPL status
- **Education Assessment**: Children's enrollment status, scholarship needs, and digital access
- **Health Evaluation**: Chronic illness tracking, health scheme access, and insurance needs
- **Elder Care Support**: Old age pension status and assistance requirements
- **Real-time Data Management**: Live updates and data synchronization
- **Export Capabilities**: CSV export and summary reports
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome icons
- Responsive design with CSS Grid and Flexbox

### Backend
- Node.js with Express.js
- SQLite database for data storage
- Socket.IO for real-time updates
- RESTful API endpoints

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Backend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   # For production
   npm start
   
   # For development (with auto-restart)
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:4000
   - API Endpoints: http://localhost:4000/api
   - Health Check: http://localhost:4000/api/health

### Database

The application uses SQLite database (`karamchedu_survey.db`) which is automatically created when you first run the server. The database includes:

- **surveys table**: All survey responses
- **users table**: For future authentication features

## API Endpoints

### Survey Management
- `GET /api/surveys` - Get all survey responses
- `POST /api/surveys` - Submit new survey
- `GET /api/surveys/:id` - Get specific survey by ID

### Statistics & Export
- `GET /api/stats` - Get survey statistics
- `GET /api/export/csv` - Export data as CSV
- `GET /api/health` - Health check endpoint

## Survey Sections

### 1. Household Information
- Name of head of family
- Address and contact details
- Family size and BPL card information
- Caste/community details (optional)

### 2. Education
- Number of children (0-18 years)
- School enrollment status
- Scholarship and financial aid needs
- Digital device access
- Special needs identification

### 3. Health
- Chronic illness tracking
- Government health scheme access
- Health insurance requirements
- Clean water and sanitation access

### 4. Elder Care
- Number of elderly family members
- Old age pension status
- Medical and daily assistance needs

### 5. Other Needs
- Additional government scheme requests
- General comments and feedback

## Data Export

### CSV Export
- Complete survey data in spreadsheet format
- Suitable for analysis in Excel or other tools
- Includes all survey fields and timestamps

### Summary Report
- Key statistics and insights
- Percentage breakdowns by need category
- Recommendations for government intervention

## Real-time Features

- Live data updates using WebSocket connections
- Instant notification of new survey submissions
- Automatic data refresh in the view tab

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Duplicate phone number prevention

## File Structure

```
karamchedu-survey/
├── index.html          # Main application page
├── styles.css          # Application styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend server
├── package.json        # Node.js dependencies
├── karamchedu_survey.db # SQLite database (auto-generated)
└── README.md           # This file
```

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon to automatically restart the server when files change.

### Database Reset
To reset the database, simply delete the `karamchedu_survey.db` file and restart the server. A new database will be created automatically.

### Adding New Features
1. Backend: Add new routes in `server.js`
2. Frontend: Update `script.js` for new functionality
3. Database: Modify the `initDatabase()` function for new tables/fields

## Deployment

### Local Deployment
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Access at: http://localhost:4000

### Production Deployment
1. Set environment variables:
   - `PORT`: Server port (default: 4000)
   - `NODE_ENV`: Set to 'production'
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "karamchedu-survey"
   ```

## Support

For technical support or questions about the application, please contact the development team.

## License

This project is licensed under the MIT License.

---

**Note**: This application is designed specifically for the Karamchedu village survey initiative and should be used in accordance with local government guidelines and data protection regulations. 