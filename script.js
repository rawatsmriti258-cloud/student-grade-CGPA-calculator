// Grade Scale Configuration
const GRADE_MAP = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0
};

// Initial State
let courses = [
    { name: 'Subject 1', credits: 4, grade: 'A+' },
    { name: 'Subject 2', credits: 3, grade: 'A' },
    { name: 'Subject 3', credits: 3, grade: 'B+' },
    { name: 'Subject 4', credits: 2, grade: 'O' }
];

let gradeChart = null;

// DOM Elements
const courseList = document.getElementById('course-list');
const addCourseBtn = document.getElementById('add-course-btn');
const resetBtn = document.getElementById('reset-all-btn');
const prevCgpaInput = document.getElementById('prev-cgpa');
const prevCreditsInput = document.getElementById('prev-credits');

// Displays
const overallCgpaDisplay = document.getElementById('overall-cgpa-display');
const totalCreditsDisplay = document.getElementById('total-credits-display');
const currentSgpaDisplay = document.getElementById('current-sgpa-display');
const calcSgpa = document.getElementById('calc-sgpa');
const calcNewCgpa = document.getElementById('calc-new-cgpa');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadLocalStorage();
    setupTabNavigation();
    renderCourses();
    calculateSemester();
    initChart();

    // Event Listeners
    addCourseBtn.addEventListener('click', addCourseRow);
    resetBtn.addEventListener('click', resetAllData);
    prevCgpaInput.addEventListener('input', calculateSemester);
    prevCreditsInput.addEventListener('input', calculateSemester);

    document.getElementById('calculate-predictor-btn').addEventListener('click', calculateTargetPredictor);
});

// Tab Navigation Logic
function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

// Render Course Rows
function renderCourses() {
    courseList.innerHTML = '';
    courses.forEach((course, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="text" value="${course.name}" onchange="updateCourse(${index}, 'name', this.value)" placeholder="Course Name">
            </td>
            <td>
                <input type="number" value="${course.credits}" min="0.5" step="0.5" onchange="updateCourse(${index}, 'credits', parseFloat(this.value) || 0)">
            </td>
            <td>
                <select onchange="updateCourse(${index}, 'grade', this.value)">
                    ${Object.keys(GRADE_MAP).map(g => `<option value="${g}" ${course.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                </select>
            </td>
            <td><strong>${GRADE_MAP[course.grade]}</strong></td>
            <td>
                <button class="remove-btn" onclick="removeCourse(${index})" title="Delete Course">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        courseList.appendChild(tr);
    });
}

// Course Array Actions
function addCourseRow() {
    courses.push({ name: `Subject ${courses.length + 1}`, credits: 3, grade: 'A' });
    renderCourses();
    calculateSemester();
}

function removeCourse(index) {
    courses.splice(index, 1);
    renderCourses();
    calculateSemester();
}

function updateCourse(index, field, value) {
    courses[index][field] = value;
    if (field === 'grade') renderCourses();
    calculateSemester();
}

// Calculations Logic
function calculateSemester() {
    let totalSemPoints = 0;
    let totalSemCredits = 0;

    courses.forEach(c => {
        const credits = parseFloat(c.credits) || 0;
        const points = GRADE_MAP[c.grade] || 0;
        totalSemPoints += credits * points;
        totalSemCredits += credits;
    });

    const sgpa = totalSemCredits > 0 ? (totalSemPoints / totalSemCredits) : 0;

    // Previous history integration
    const prevCgpa = parseFloat(prevCgpaInput.value) || 0;
    const prevCredits = parseFloat(prevCreditsInput.value) || 0;

    const totalCumulativePoints = (prevCgpa * prevCredits) + totalSemPoints;
    const overallCredits = prevCredits + totalSemCredits;
    const finalCgpa = overallCredits > 0 ? (totalCumulativePoints / overallCredits) : sgpa;

    // Update UI Elements
    calcSgpa.innerText = sgpa.toFixed(2);
    currentSgpaDisplay.innerText = sgpa.toFixed(2);

    calcNewCgpa.innerText = finalCgpa.toFixed(2);
    overallCgpaDisplay.innerText = finalCgpa.toFixed(2);
    totalCreditsDisplay.innerText = overallCredits;

    saveLocalStorage();
    updateChart();
}

// Target Predictor Logic
function calculateTargetPredictor() {
    const currentCgpa = parseFloat(document.getElementById('pred-current-cgpa').value);
    const completedCredits = parseFloat(document.getElementById('pred-completed-credits').value);
    const targetCgpa = parseFloat(document.getElementById('pred-target-cgpa').value);
    const remainingCredits = parseFloat(document.getElementById('pred-remaining-credits').value);

    const resultCard = document.getElementById('predictor-result-card');
    const requiredGpaVal = document.getElementById('required-gpa-val');
    const badge = document.getElementById('status-badge');
    const analysisText = document.getElementById('predictor-analysis');

    if (isNaN(currentCgpa) || isNaN(completedCredits) || isNaN(targetCgpa) || isNaN(remainingCredits) || remainingCredits <= 0) {
        alert('Please fill out all predictor fields correctly.');
        return;
    }

    const currentPoints = currentCgpa * completedCredits;
    const totalDesiredPoints = targetCgpa * (completedCredits + remainingCredits);
    const requiredPoints = totalDesiredPoints - currentPoints;
    const requiredGpa = requiredPoints / remainingCredits;

    resultCard.classList.remove('hidden');
    requiredGpaVal.innerText = requiredGpa.toFixed(2);

    if (requiredGpa > 10.0) {
        badge.className = 'badge badge-danger';
        badge.innerText = 'Impossible';
        analysisText.innerText = `To achieve a ${targetCgpa} CGPA, you would need an average GPA of ${requiredGpa.toFixed(2)} in your remaining credits, which exceeds the maximum limit of 10.0.`;
    } else if (requiredGpa > 9.0) {
        badge.className = 'badge badge-warning';
        badge.innerText = 'Challenging';
        analysisText.innerText = `You need an average GPA of ${requiredGpa.toFixed(2)} in remaining credits. This requires outstanding grades (mostly O & A+).`;
    } else if (requiredGpa <= 0) {
        badge.className = 'badge badge-success';
        badge.innerText = 'Target Achieved';
        analysisText.innerText = `Your target CGPA is already lower than or equal to your current performance trajectory!`;
    } else {
        badge.className = 'badge badge-success';
        badge.innerText = 'Achievable';
        analysisText.innerText = `Target is comfortably achievable. Maintain a average GPA of ${requiredGpa.toFixed(2)} across remaining semesters.`;
    }
}

// Chart Visualization
function initChart() {
    const ctx = document.getElementById('gradeChart').getContext('2d');
    gradeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(GRADE_MAP),
            datasets: [{
                data: new Array(Object.keys(GRADE_MAP).length).fill(0),
                backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

function updateChart() {
    if (!gradeChart) return;
    const counts = {};
    Object.keys(GRADE_MAP).forEach(g => counts[g] = 0);
    courses.forEach(c => { if (counts[c.grade] !== undefined) counts[c.grade]++; });

    gradeChart.data.datasets[0].data = Object.values(counts);
    gradeChart.update();
}

// Local Storage Management
function saveLocalStorage() {
    const state = {
        courses,
        prevCgpa: prevCgpaInput.value,
        prevCredits: prevCreditsInput.value
    };
    localStorage.setItem('cgpa_app_data', JSON.stringify(state));
}

function loadLocalStorage() {
    const saved = localStorage.getItem('cgpa_app_data');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            if (state.courses) courses = state.courses;
            if (state.prevCgpa) prevCgpaInput.value = state.prevCgpa;
            if (state.prevCredits) prevCreditsInput.value = state.prevCredits;
        } catch (e) {
            console.error('Failed to parse local storage data');
        }
    }
}

function resetAllData() {
    if (confirm('Are you sure you want to clear all entered subjects and data?')) {
        localStorage.removeItem('cgpa_app_data');
        courses = [];
        prevCgpaInput.value = '';
        prevCreditsInput.value = '';
        renderCourses();
        calculateSemester();
    }
}
