document.addEventListener('DOMContentLoaded', function () {
    const connectCalendarBtn = document.getElementById('connect-calendar-btn');
    const useCalendarCheckbox = document.getElementById('use-calendar-checkbox');
    const manualHoursInput = document.getElementById('manual-hours-input');
    const planForm = document.getElementById('plan-form');
    const planOutput = document.getElementById('plan-output');
    const subjectsInput = document.getElementById('subjects');
    const deadlinesInput = document.getElementById('deadlines');


    // Set your deployed backend URL here
    const API_BASE_URL = (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))
      ? 'http://localhost:3000'
      : 'https://ai-timemanager.onrender.com'; // <-- CHANGE THIS to your real Render backend URL

    // Always allow user to try connecting Google Calendar
    connectCalendarBtn.disabled = false;
    connectCalendarBtn.textContent = 'Connect Google Calendar';

    // Check auth status on page load
    fetch(`${API_BASE_URL}/api/auth-status`, { credentials: 'include' })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data.isAuthenticated) {
                connectCalendarBtn.textContent = 'Connected to Google Calendar';
                connectCalendarBtn.disabled = true;
                useCalendarCheckbox.checked = true;
                manualHoursInput.style.display = 'none';
            } else {
                connectCalendarBtn.textContent = 'Connect Google Calendar';
                connectCalendarBtn.disabled = false;
                useCalendarCheckbox.checked = false;
                manualHoursInput.style.display = 'block';
            }
        })
        .catch(error => {
            console.error("Error checking auth status:", error);
            planOutput.textContent = "Could not connect to the server. Please ensure it's running.";
            connectCalendarBtn.textContent = 'Connect Google Calendar';
            connectCalendarBtn.disabled = false;
            useCalendarCheckbox.checked = false;
            manualHoursInput.style.display = 'block';
        });

    // Redirect to Google auth on button click
    connectCalendarBtn.addEventListener('click', () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    });

    // Toggle manual hours input based on checkbox
    useCalendarCheckbox.addEventListener('change', () => {
        manualHoursInput.style.display = useCalendarCheckbox.checked ? 'none' : 'block';
    });

    planForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        await generatePlan();
    });

    async function generatePlan() {
        const subjects = subjectsInput.value.trim();
        const deadlines = deadlinesInput.value.trim();
        const freeHours = document.getElementById("freeHours").value.trim();
        const extraNotes = document.getElementById("extraNotes").value.trim();
        const useCalendar = useCalendarCheckbox.checked;

        let requestBody = {
            subjects: subjects.split(",").map(s => s.trim()),
            deadlines: JSON.parse(deadlines),
            extraNotes,
            useCalendar
        };

        if (!useCalendar) {
            if (!freeHours) {
                planOutput.textContent = "Please provide your free hours per day.";
                return;
            }
            requestBody.freeHours = parseInt(freeHours);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/generate-plan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            if (response.ok) {
                planOutput.textContent = data.plan;
            } else {
                planOutput.textContent = `Error: ${data.error || 'Something went wrong.'}`;
            }
        } catch (error) {
            planOutput.textContent = "❌ Error: Please enter valid JSON for deadlines.\nExample: { \"Math\": \"2025-06-10\", \"Science\": \"2025-06-12\" }";
            console.error(error);
        }
    }
});
