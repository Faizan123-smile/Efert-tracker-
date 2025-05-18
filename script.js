document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const initialAnnualInput = document.getElementById('initialAnnual');
    const initialAnnualCarryoverInput = document.getElementById('initialAnnualCarryover');
    const initialCasualInput = document.getElementById('initialCasual');
    const initialMedicalInput = document.getElementById('initialMedical');
    const initialMedicalCarryoverInput = document.getElementById('initialMedicalCarryover');
    const setBalancesBtn = document.getElementById('setBalancesBtn');
    const resetCarryoverBtn = document.getElementById('resetCarryoverBtn'); // Get reset carryover button

    const currentAnnualDisplay = document.getElementById('currentAnnual');
    const currentCasualDisplay = document.getElementById('currentCasual');
    const currentMedicalDisplay = document.getElementById('currentMedical');

    const addRequestForm = document.getElementById('addRequestForm');
    const requestDateFromInput = document.getElementById('requestDateFrom');
    const requestDateToInput = document.getElementById('requestDateTo');
    const requestTypeInput = document.getElementById('requestType');
    const submitRequestBtn = document.getElementById('submitRequestBtn'); // Get the submit button
    const leaveHistoryList = document.getElementById('leaveHistoryList');
    const downloadReportBtn = document.getElementById('downloadReportBtn'); // Get the download report button

    const splashScreen = document.getElementById('splashScreen'); // Get the splash screen element
    const appContent = document.getElementById('appContent'); // Get the main app content element

    // Get references to the sections for the report
    const currentBalancesSection = document.getElementById('currentBalancesSection');
    const leaveHistorySection = document.getElementById('leaveHistorySection');


    // State variables
    let currentAnnual = 0;
    let currentCasual = 0;
    let currentMedical = 0;
    const ANNUAL_LEAVE_CAP = 60;
    const MEDICAL_LEAVE_CAP = 32;
    let leaveHistory = [];
    let editingIndex = -1; // -1 indicates not editing, otherwise stores the index of the request being edited

    // --- Local Storage Key ---
    // Using a single key as there is no user-specific data handling across devices
    const DATA_STORAGE_KEY = 'leaveTrackerData';

    // --- Local Storage Functions ---

    // Function to save data to localStorage
    const saveData = () => {
        console.log("Saving data:", { currentAnnual, currentCasual, currentMedical, leaveHistory }); // Log before saving
        const dataToSave = {
            currentAnnual: currentAnnual,
            currentCasual: currentCasual, // Correct key
            currentMedical: currentMedical, // Correct key
            leaveHistory: leaveHistory
        };
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dataToSave));
         console.log("Data saved to localStorage."); // Log after saving
    };

    // Function to load data from localStorage
    const loadData = () => {
        console.log("Attempting to load data..."); // Log 1
        const savedData = localStorage.getItem(DATA_STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                currentAnnual = parsedData.currentAnnual || 0;
                // Corrected keys to match saveData
                currentCasual = parsedData.currentCasual || 0;
                currentMedical = parsedData.currentMedical || 0;
                leaveHistory = parsedData.leaveHistory || [];
                console.log("Data loaded:", { currentAnnual, currentCasual, currentMedical, leaveHistory }); // Log 2
            } catch (e) {
                 console.error("Error parsing saved data from localStorage:", e);
                 // If parsing fails, reset data and log
                 currentAnnual = 0;
                 currentCasual = 0;
                 currentMedical = 0;
                 leaveHistory = [];
                 console.log("Data parsing failed. Resetting data.");
            }

        } else {
             console.log("No saved data found. Setting initial balances."); // Log 3
             setInitialBalances(false); // Set initial balances but don't save immediately
        }
    };

    // --- End Local Storage Functions ---


    // Function to update the displayed balances
    const updateDisplay = () => {
        console.log("Updating display with balances:", { currentAnnual, currentCasual, currentMedical }); // Log before updating display
        currentAnnualDisplay.textContent = currentAnnual;
        currentCasualDisplay.textContent = currentCasual;
        currentMedicalDisplay.textContent = currentMedical;
         console.log("Display updated."); // Log after updating display
    };

    // Function to render the leave history
    const renderHistory = () => {
        console.log("Rendering history:", leaveHistory); // Log before rendering history
        leaveHistoryList.innerHTML = ''; // Clear current history display
        if (leaveHistory.length === 0) {
            const listItem = document.createElement('li');
            listItem.classList.add('py-4', 'text-gray-600', 'text-center');
            listItem.textContent = 'No leave requests added yet.';
            leaveHistoryList.appendChild(listItem);
        } else {
            leaveHistory.forEach((request, index) => { // Include index
                const listItem = document.createElement('li');
                listItem.classList.add('py-4', 'flex', 'flex-col', 'md:flex-row', 'justify-between', 'items-center', 'border-b', 'border-gray-200');

                // Leave details
                const detailsDiv = document.createElement('div');
                detailsDiv.classList.add('mb-2', 'md:mb-0', 'text-center', 'md:text-left');
                 detailsDiv.innerHTML = `
                    <p class="text-lg font-medium text-gray-800">${request.dateFrom} to ${request.dateTo}</p>
                    <p class="text-sm text-gray-600 capitalize">${request.type} Leave - ${request.days} day(s)</p>
                `;

                // Action buttons container
                const actionsDiv = document.createElement('div');
                actionsDiv.classList.add('flex', 'space-x-2');

                // Edit Button
                const editButton = document.createElement('button');
                editButton.classList.add('bg-yellow-500', 'hover:bg-yellow-600', 'text-white', 'font-bold', 'py-1', 'px-3', 'rounded-full', 'focus:outline-none', 'focus:shadow-outline', 'text-sm', 'transition', 'duration-300', 'ease-in-out');
                editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
                editButton.addEventListener('click', () => editLeaveRequest(index)); // Add click listener

                // Delete Button
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('bg-red-500', 'hover:bg-red-600', 'text-white', 'font-bold', 'py-1', 'px-3', 'rounded-full', 'focus:outline-none', 'focus:shadow-outline', 'text-sm', 'transition', 'duration-300', 'ease-in-out');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
                deleteButton.addEventListener('click', () => deleteLeaveRequest(index)); // Add click listener

                actionsDiv.appendChild(editButton);
                actionsDiv.appendChild(deleteButton);

                listItem.appendChild(detailsDiv);
                listItem.appendChild(actionsDiv);
                leaveHistoryList.appendChild(listItem);
            });
        }
         console.log("History rendered."); // Log after rendering history
    };

    // Function to calculate and set initial current balances
    const setInitialBalances = (saveImmediately = true) => {
        console.log("Setting initial balances (saveImmediately:", saveImmediately, ")"); // Log 4
        let initialAnnual = parseInt(initialAnnualInput.value) || 0;
        let initialAnnualCarryover = parseInt(initialAnnualCarryoverInput.value) || 0;
        let initialCasual = parseInt(initialCasualInput.value) || 0;
        let initialMedical = parseInt(initialMedicalInput.value) || 0;
        let initialMedicalCarryover = parseInt(initialMedicalCarryoverInput.value) || 0;

        // Validate and adjust annual carryover if it exceeds the cap
        const potentialAnnualTotal = initialAnnual + initialAnnualCarryover;
        if (potentialAnnualTotal > ANNUAL_LEAVE_CAP) {
            const adjustedCarryover = ANNUAL_LEAVE_CAP - initialAnnual;
            initialAnnualCarryoverInput.value = Math.max(0, adjustedCarryover); // Ensure carryover is not negative
            alert(`Annual leave (current + carryover) cannot exceed ${ANNUAL_LEAVE_CAP} days. Carryover adjusted to ${initialAnnualCarryoverInput.value}.`);
             initialAnnualCarryover = parseInt(initialAnnualCarryoverInput.value) || 0; // Use the adjusted value
        }

        // Validate and adjust medical carryover if it exceeds the cap
        const potentialMedicalTotal = initialMedical + initialMedicalCarryover;
        if (potentialMedicalTotal > MEDICAL_LEAVE_CAP) {
             const adjustedCarryover = MEDICAL_LEAVE_CAP - initialMedical;
             initialMedicalCarryoverInput.value = Math.max(0, adjustedCarryover); // Ensure carryover is not negative
             alert(`Medical leave (current + carryover) cannot exceed ${MEDICAL_LEAVE_CAP} days. Carryover adjusted to ${initialMedicalCarryoverInput.value}.`);
             initialMedicalCarryover = parseInt(initialMedicalCarryoverInput.value) || 0; // Use the adjusted value
        }


        // Calculate current balances using potentially adjusted carryover
        currentAnnual = Math.min(initialAnnual + initialAnnualCarryover, ANNUAL_LEAVE_CAP);
        currentCasual = initialCasual;
        currentMedical = Math.min(initialMedical + initialMedicalCarryover, MEDICAL_LEAVE_CAP); // Apply cap again for safety

        console.log("Calculated initial balances:", { currentAnnual, currentCasual, currentMedical }); // Log 5

        updateDisplay(); // Update the display with the new balances
        if (saveImmediately) {
             saveData(); // Save the updated balances only if saveImmediately is true
             alert('Initial balances set!'); // Simple notification
        }
    };

    // Handle setting initial balances when the button is clicked
    setBalancesBtn.addEventListener('click', () => setInitialBalances(true)); // Pass true to save on button click

    // Handle resetting carryover leaves
    resetCarryoverBtn.addEventListener('click', () => {
        console.log("Reset Carryover button clicked."); // Log reset click
        if (confirm('Are you sure you want to reset carryover leaves to 0?')) {
            initialAnnualCarryoverInput.value = 0;
            initialMedicalCarryoverInput.value = 0;
            setInitialBalances(true); // Recalculate and save with reset carryover
            alert('Carryover leaves have been reset.');
             console.log("Carryover leaves reset and balances updated."); // Log reset complete
        }
    });


    // Function to calculate the number of days between two dates (inclusive)
    const calculateDays = (dateFrom, dateTo) => {
        const d1 = new Date(dateFrom);
        const d2 = new Date(dateTo);
        // Set time to midnight to avoid issues with timezones and daylight saving
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        const timeDiff = d2.getTime() - d1.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24);
        return dayDiff + 1; // Add 1 to make it inclusive of the end date
    };


    // Function to handle deleting a leave request
    const deleteLeaveRequest = (index) => {
         console.log("Delete button clicked for index:", index); // Log delete click
        if (confirm('Are you sure you want to delete this leave request?')) {
            const requestToDelete = leaveHistory[index];
            console.log("Request to delete:", requestToDelete); // Log request to delete

            // Add the leave days back to the current balance
            switch (requestToDelete.type) {
                case 'annual':
                    currentAnnual += requestToDelete.days;
                    break;
                case 'casual':
                    currentCasual += requestToDelete.days;
                    break;
                case 'medical':
                    currentMedical += requestToDelete.days;
                    break;
            }
            console.log("Balances after adding back deleted days:", { currentAnnual, currentCasual, currentMedical }); // Log balance after deleting

            // Remove the request from the history array
            leaveHistory.splice(index, 1);
             console.log("Leave history after deletion:", leaveHistory); // Log history after deletion

            // Update display, render history, and save data
            updateDisplay();
            renderHistory();
            saveData();
            alert('Leave request deleted.');
             console.log("Leave request deleted and balances updated."); // Log delete complete
        }
    };

    // Function to handle editing a leave request
    const editLeaveRequest = (index) => {
        console.log("Edit button clicked for index:", index); // Log edit click
        const requestToEdit = leaveHistory[index];
        console.log("Request to edit:", requestToEdit); // Log request to edit

        // Populate the form with the request data
        requestDateFromInput.value = requestToEdit.dateFrom;
        requestDateToInput.value = requestToEdit.dateTo;
        requestTypeInput.value = requestToEdit.type;

        // Store the index of the request being edited
        editingIndex = index;

        // Change the submit button text to indicate editing
        submitRequestBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Update Request';
         submitRequestBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
         submitRequestBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');

        // Optionally, scroll to the form
        addRequestForm.scrollIntoView({ behavior: 'smooth' });
         console.log("Form populated for editing."); // Log form population
    };


    // Handle adding or updating a leave request when the form is submitted
    addRequestForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        console.log("Form submitted."); // Log form submission

        const dateFrom = requestDateFromInput.value;
        const dateTo = requestDateToInput.value;
        const type = requestTypeInput.value;

        // Basic validation for dates
        if (!dateFrom || !dateTo) {
            alert('Please enter both Date From and Date To.');
            console.log("Date validation failed."); // Log date validation failure
            return;
        }

        const days = calculateDays(dateFrom, dateTo);

        if (days <= 0) {
             alert('Date To must be on or after Date From.');
             console.log("Date range validation failed."); // Log date range validation failure
             return;
        }

        let success = false; // Declare success here

        // --- Handle Editing ---
        if (editingIndex !== -1) {
            console.log("Handling edit for index:", editingIndex); // Log editing start
            const originalRequest = leaveHistory[editingIndex];
            console.log("Original request:", originalRequest); // Log original request

            // Add the original leave days back to the balance temporarily
            switch (originalRequest.type) {
                case 'annual':
                    currentAnnual += originalRequest.days;
                    break;
                case 'casual':
                    currentCasual += originalRequest.days;
                    break;
                case 'medical':
                    currentMedical += originalRequest.days;
                    break;
            }
            console.log("Balances after adding back original days:", { currentAnnual, currentCasual, currentMedical }); // Log balance after adding back

            // Check if enough leave is available for the *new* request
             switch (type) {
                case 'annual':
                    if (currentAnnual >= days) {
                        currentAnnual -= days;
                        success = true;
                    } else {
                        alert('Not enough Annual Leave available for the updated request.');
                        // Revert balance if not enough leave
                        currentAnnual += originalRequest.days; // Subtract back the original days
                         console.log("Edit failed - not enough annual leave. Balances reverted:", { currentAnnual, currentCasual, currentMedical }); // Log revert
                        return; // Stop the process
                    }
                    break;
                case 'casual':
                    if (currentCasual >= days) {
                        currentCasual -= days;
                        success = true;
                    } else {
                        alert('Not enough Casual Leave available for the updated request.');
                         currentCasual += originalRequest.days;
                          console.log("Edit failed - not enough casual leave. Balances reverted:", { currentAnnual, currentCasual, currentMedical }); // Log revert
                         return;
                    }
                    break;
                case 'medical':
                    if (currentMedical >= days) {
                        currentMedical -= days;
                        success = true;
                    } else {
                        alert('Not enough Medical Leave available for the updated request.');
                         currentMedical += originalRequest.days;
                          console.log("Edit failed - not enough medical leave. Balances reverted:", { currentAnnual, currentCasual, currentMedical }); // Log revert
                         return;
                    }
                    break;
            }

            if (success) {
                 console.log("Edit successful. New balances before updating history:", { currentAnnual, currentCasual, currentMedical }); // Log balance before history update
                 // Update the existing request in the history array
                 leaveHistory[editingIndex] = { dateFrom, dateTo, type, days };
                 console.log("Leave history after edit:", leaveHistory); // Log history after edit

                 // Reset editing state
                 editingIndex = -1;
                 submitRequestBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Update Request';
                 submitRequestBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
                 submitRequestBtn.classList.add('bg-green-600', 'hover:bg-green-700');

                 alert('Leave request updated successfully.');
            }


        } else {
            // --- Handle Adding New Request ---
             console.log("Adding new request."); // Log adding new
            // Check if enough leave is available
            switch (type) {
                case 'annual':
                    if (currentAnnual >= days) {
                        currentAnnual -= days;
                        success = true; // Explicitly set success to true
                    } else {
                        alert('Not enough Annual Leave available.');
                         console.log("Add failed - not enough annual leave."); // Log add failed
                    }
                    break;
                case 'casual':
                    if (currentCasual >= days) {
                        currentCasual -= days;
                        success = true; // Explicitly set success to true
                    } else {
                        alert('Not enough Casual Leave available.');
                         console.log("Add failed - not enough casual leave."); // Log add failed
                    }
                    break;
                case 'medical':
                    if (currentMedical >= days) {
                        currentMedical -= days;
                        success = true; // Explicitly set success to true
                    } else {
                        alert('Not enough Medical Leave available.');
                         console.log("Add failed - not enough medical leave."); // Log add failed
                    }
                    break;
            }

            // If leave was successfully deducted, add to history
            if (success) {
                leaveHistory.push({ dateFrom, dateTo, type, days }); // Store date range
                 console.log("New request added to history:", leaveHistory); // Log history after add
                alert('Leave request added successfully.');
            }
        }

        // Actions to perform after either adding or updating
        if (success) {
             console.log("Update/Add successful. Performing final updates."); // Log final updates
             updateDisplay();
             renderHistory();
             saveData(); // Save the updated balances and history

             // Reset form fields
             requestDateFromInput.value = '';
             requestDateToInput.value = '';
             requestTypeInput.value = 'annual'; // Reset to default
        } else {
             console.log("Update/Add failed. No changes saved or displayed."); // Log final updates skipped
        }
    });


    // --- Print Report Generation Logic ---
    downloadReportBtn.addEventListener('click', () => {
        console.log("Download Report (Print) button clicked."); // Log button click

        // Create the HTML content for the print window
        let printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Leave Tracker Report</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 0; padding: 15mm; }
                    h1, h2 { color: #000; margin-bottom: 10px; }
                    h1 { font-size: 24px; text-align: center; }
                    h2 { font-size: 18px; margin-top: 20px; }
                    .balances p { margin-bottom: 5px; font-size: 14px; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                        font-size: 12px;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    /* Add any other styles needed for print */
                </style>
            </head>
            <body>
                <h1>Leave Tracker Report</h1>
                <div class="balances">
                    <h2>Current Balances:</h2>
                    <p>Annual Leave: ${currentAnnual} days</p>
                    <p>Casual Leave: ${currentCasual} days</p>
                    <p>Medical Leave: ${currentMedical} days</p>
                </div>
        `;

        // Add leave history table if there is history
        if (leaveHistory.length > 0) {
            printContent += `
                <h2>Leave Request History:</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date From</th>
                            <th>Date To</th>
                            <th>Leave Type</th>
                            <th>Days</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            leaveHistory.forEach(request => {
                printContent += `
                    <tr>
                        <td>${request.dateFrom}</td>
                        <td>${request.dateTo}</td>
                        <td>${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</td>
                        <td>${request.days}</td>
                    </tr>
                `;
            });
            printContent += `
                    </tbody>
                </table>
            `;
        } else {
            printContent += `<p>No leave requests recorded yet.</p>`;
        }

        printContent += `
            </body>
            </html>
        `;

        // Open a new window and write the content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();

            // Wait for content to load and then print
            printWindow.onload = () => {
                printWindow.print();
                // Optional: Close the window after printing (some browsers handle this automatically)
                // printWindow.close();
            };
             console.log("Print window opened and content written."); // Log print window opened
        } else {
            alert("Could not open print window. Please allow pop-ups for this site.");
             console.error("Failed to open print window."); // Log print window failure
        }
    });


    // --- Initialization ---
    // Hide main content initially
    appContent.style.display = 'none';

    // Show splash screen for 3 seconds
    setTimeout(() => {
        splashScreen.classList.add('fade-out'); // Add fade-out class

        // After fade-out transition (0.5s), hide splash screen and show app content
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none';
            appContent.style.display = 'block';
             console.log("Splash screen hidden, app content shown."); // Log display change

            // Load data and update display after splash screen
            loadData(); // Attempt to load data when the page loads
            updateDisplay(); // Update the display with loaded or default balances
            renderHistory(); // Render loaded or empty history
            console.log("Application initialized after splash screen."); // Log initialization complete

        }, { once: true }); // Remove listener after it runs once


    }, 3000); // 3000 milliseconds = 3 seconds
});


