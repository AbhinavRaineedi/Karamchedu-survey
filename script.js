// Frontend JavaScript for Karamchedu Village Survey
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

// Global variables
let surveyData = [];
let socket;

// Initialize the application
function initApp() {
    setupNavigation();
    setupFormHandlers();
    setupDataView();
    setupExportHandlers();
    connectWebSocket();
    loadSurveyData();
}

// Setup navigation tabs
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load data if viewing data tab
            if (targetTab === 'data') {
                loadSurveyData();
            }
        });
    });
}

// Setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('surveyForm');
    
    // Handle conditional form fields
    setupConditionalFields();
    
    // Handle form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Handle form reset
    form.addEventListener('reset', () => {
        hideConditionalFields();
    });
}

// Setup conditional form fields
function setupConditionalFields() {
    // Education section
    const allEnrolledSelect = document.getElementById('allEnrolled');
    const notEnrolledReason = document.getElementById('notEnrolledReason');
    
    allEnrolledSelect.addEventListener('change', () => {
        if (allEnrolledSelect.value === 'No') {
            notEnrolledReason.style.display = 'block';
        } else {
            notEnrolledReason.style.display = 'none';
            document.getElementById('notEnrolledReasonText').value = '';
        }
    });
    
    // Health section
    const chronicIllnessSelect = document.getElementById('chronicIllness');
    const illnessDetails = document.getElementById('illnessDetails');
    
    chronicIllnessSelect.addEventListener('change', () => {
        if (chronicIllnessSelect.value === 'Yes') {
            illnessDetails.style.display = 'block';
        } else {
            illnessDetails.style.display = 'none';
            document.getElementById('illnessDetailsText').value = '';
        }
    });
}

// Hide all conditional fields
function hideConditionalFields() {
    document.getElementById('notEnrolledReason').style.display = 'none';
    document.getElementById('illnessDetails').style.display = 'none';
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const surveyData = Object.fromEntries(formData.entries());
    
    // Add timestamp
    surveyData.timestamp = new Date().toISOString();
    surveyData.date = new Date().toLocaleDateString('en-IN');
    
    try {
        const response = await fetch('/api/surveys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(surveyData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccessModal();
            event.target.reset();
            hideConditionalFields();
            loadSurveyData(); // Refresh data
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error submitting survey:', error);
        alert('Error submitting survey. Please try again.');
    }
}

// Setup data view
function setupDataView() {
    const searchInput = document.getElementById('searchInput');
    const refreshButton = document.getElementById('refreshData');
    
    searchInput.addEventListener('input', filterData);
    refreshButton.addEventListener('click', loadSurveyData);
}

// Load survey data
async function loadSurveyData() {
    try {
        const response = await fetch('/api/surveys');
        const data = await response.json();
        
        if (response.ok) {
            surveyData = data;
            displaySurveyData(data);
            updateStatistics();
        } else {
            console.error('Error loading data:', data.error);
        }
    } catch (error) {
        console.error('Error loading survey data:', error);
    }
}

// Display survey data in table
function displaySurveyData(data) {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    data.forEach(survey => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${survey.date}</td>
            <td>${survey.headName}</td>
            <td>${survey.phone}</td>
            <td>${survey.familyMembers}</td>
            <td>${survey.caste}</td>
            <td>${survey.profession}</td>
            <td>${survey.income}</td>
            <td>${survey.privateSchool}</td>
            <td>${survey.tuition}</td>
            <td>${survey.costPerYear}</td>
            <td>${survey.lifeInsurance}</td>
            <td>${survey.elderlyCount}</td>
            <td>${survey.foodDelivery}</td>
            <td>${survey.payForFood}</td>
            <td>${survey.takeIfFree}</td>
            <td>${survey.medicineDelivery}</td>
            <td>${survey.hospitalVisits}</td>
            <td>${survey.bpCheck}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteSurvey(${survey.id}, '${survey.headName}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Delete survey with confirmation
async function deleteSurvey(surveyId, headName) {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete the survey for ${headName}?\n\nThis action cannot be undone and will permanently remove the data from all files including CSV exports.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/surveys/${surveyId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Remove from local array
            surveyData = surveyData.filter(survey => survey.id !== surveyId);
            
            // Update display
            displaySurveyData(surveyData);
            updateStatistics();
            
            // Show success notification
            showNotification('Survey deleted successfully!');
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error deleting survey:', error);
        alert('Error deleting survey. Please try again.');
    }
}

// Filter data based on search input
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = surveyData.filter(survey => 
        survey.headName.toLowerCase().includes(searchTerm) ||
        survey.phone.includes(searchTerm) ||
        survey.address.toLowerCase().includes(searchTerm)
    );
    displaySurveyData(filteredData);
}

// Update statistics
async function updateStatistics() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        if (response.ok) {
            document.getElementById('totalResponses').textContent = stats.totalResponses || 0;
            document.getElementById('educationNeeds').textContent = stats.educationNeeds || 0;
            document.getElementById('healthNeeds').textContent = stats.healthNeeds || 0;
            document.getElementById('elderCareNeeds').textContent = stats.elderCareNeeds || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Setup export handlers
function setupExportHandlers() {
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportSummary').addEventListener('click', exportSummary);
}

// Export CSV
async function exportCSV() {
    try {
        const response = await fetch('/api/export/csv');
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'karamchedu_survey_data.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error exporting data. Please try again.');
    }
}

// Export summary
function exportSummary() {
    const summary = generateSummaryReport();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karamchedu_survey_summary.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Generate summary report
function generateSummaryReport() {
    const total = surveyData.length;
    const educationNeeds = surveyData.filter(s => s.needScholarship === 'Yes').length;
    const healthNeeds = surveyData.filter(s => s.healthInsurance === 'Yes' || s.chronicIllness === 'Yes').length;
    const elderCareNeeds = surveyData.filter(s => s.medicalAssistance === 'Yes' || s.dailyAssistance === 'Yes').length;
    
    return `KARAMCHEDU VILLAGE SURVEY SUMMARY REPORT
Generated on: ${new Date().toLocaleString('en-IN')}

TOTAL RESPONSES: ${total}

EDUCATION NEEDS:
- Families needing scholarships: ${educationNeeds}
- Percentage: ${total > 0 ? ((educationNeeds / total) * 100).toFixed(1) : 0}%

HEALTH NEEDS:
- Families with health needs: ${healthNeeds}
- Percentage: ${total > 0 ? ((healthNeeds / total) * 100).toFixed(1) : 0}%

ELDER CARE NEEDS:
- Families needing elder care: ${elderCareNeeds}
- Percentage: ${total > 0 ? ((elderCareNeeds / total) * 100).toFixed(1) : 0}%

RECOMMENDATIONS:
1. Focus on education support for ${educationNeeds} families
2. Provide health assistance to ${healthNeeds} families
3. Implement elder care programs for ${elderCareNeeds} families
4. Continue monitoring and follow-up with all surveyed families

This report is generated from the Karamchedu Village Survey system.
`;
}

// Connect WebSocket for real-time updates
function connectWebSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('newSurvey', (survey) => {
        // Add new survey to the beginning of the array
        surveyData.unshift(survey);
        displaySurveyData(surveyData);
        updateStatistics();
        
        // Show notification
        showNotification('New survey submitted!');
    });
    
    socket.on('surveyDeleted', (data) => {
        // Remove deleted survey from local array
        surveyData = surveyData.filter(survey => survey.id !== data.id);
        displaySurveyData(surveyData);
        updateStatistics();
        
        // Show notification
        showNotification('A survey was deleted by another user');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal with X button
document.querySelector('.close').onclick = closeModal;

/* Delete Button Styles */
.btn-danger {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;
}

.btn-danger:hover {
    background: linear-gradient(135deg, #ff5252, #d32f2f);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-sm {
    padding: 6px 12px;
    font-size: 11px;
}

.data-table td:last-child {
    text-align: center;
}
