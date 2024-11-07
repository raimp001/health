// Global error handler
window.addEventListener('error', function(event) {
    console.error('Script error:', event.error);
});

// Global variables
let diagnoses = [];
let services = {
    labs: [],
    radiology: [],
    procedures: [],
    other: [],
    charges: []
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Billing.js: Document loaded');
    const billingForm = document.getElementById('billingForm');
    if (billingForm) {
        console.log('Billing form found');
        setupFormHandlers();
        setupTabFunctionality();
        setupServicesHandlers();
    } else {
        console.error('Billing form not found');
    }
});

function setupFormHandlers() {
    const billingForm = document.getElementById('billingForm');
    if (billingForm) {
        billingForm.addEventListener('submit', handleFormSubmission);
    }
}

function setupServicesHandlers() {
    const serviceTypes = ['labs', 'radiology', 'procedures', 'other', 'charges'];
    serviceTypes.forEach(type => {
        const addButton = document.querySelector(`#${type} .add-button`);
        if (addButton) {
            addButton.addEventListener('click', () => addManualService(addButton));
        }
    });
}

function setupTabFunctionality() {
    // Bootstrap 5 handles tab functionality automatically through data-bs-* attributes
}

function handleDiagnosisSearch(event) {
    const searchTerm = event.target.value.trim();
    if (searchTerm.length < 2) return;
    
    // In a real app, this would make an API call to search ICD-10 codes
    console.log('Searching for diagnosis:', searchTerm);
}

function addManualDiagnosis() {
    const code = document.getElementById('diagnosisCode').value.trim();
    const description = document.getElementById('diagnosisDescription').value.trim();
    const amount = parseFloat(document.getElementById('diagnosisAmount').value) || 0;
    
    if (!code || !description) {
        alert('Please enter both code and description');
        return;
    }
    
    diagnoses.push({ code, description, amount });
    updateDiagnosesList();
    updateTotal();
    
    // Clear inputs
    document.getElementById('diagnosisCode').value = '';
    document.getElementById('diagnosisDescription').value = '';
    document.getElementById('diagnosisAmount').value = '';
}

function updateDiagnosesList() {
    const list = document.getElementById('diagnosesList');
    if (!list) return;
    
    list.innerHTML = diagnoses.map((diagnosis, index) => `
        <div class="diagnosis-item bg-light p-2 rounded mb-2 d-flex justify-content-between align-items-center">
            <span>${diagnosis.code} - ${diagnosis.description} - $${diagnosis.amount.toFixed(2)}</span>
            <button type="button" class="btn btn-link text-danger" onclick="removeDiagnosis(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeDiagnosis(index) {
    diagnoses.splice(index, 1);
    updateDiagnosesList();
    updateTotal();
}

function addManualService(button) {
    const container = button.closest('.tab-pane');
    if (!container) return;
    
    const serviceType = container.id;
    const codeInput = container.querySelector('.service-code');
    const descInput = container.querySelector('.service-description');
    const amountInput = container.querySelector('.service-amount');
    
    if (!codeInput || !descInput || !amountInput) return;
    
    const code = codeInput.value.trim();
    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!code || !description || isNaN(amount)) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    if (!services[serviceType]) {
        services[serviceType] = [];
    }
    
    services[serviceType].push({
        code,
        description,
        price: amount
    });
    
    updateServicesList(serviceType);
    updateTotal();
    
    // Clear inputs
    codeInput.value = '';
    descInput.value = '';
    amountInput.value = '';
}

function updateServicesList(serviceType) {
    const list = document.getElementById(`${serviceType}List`);
    if (!list || !services[serviceType]) return;
    
    list.innerHTML = services[serviceType].map((service, index) => `
        <div class="service-item bg-light p-2 rounded mb-2 d-flex justify-content-between align-items-center">
            <span>${service.code} - ${service.description} - $${service.price.toFixed(2)}</span>
            <button type="button" class="btn btn-link text-danger" onclick="removeService('${serviceType}', ${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeService(serviceType, index) {
    if (!services[serviceType]) return;
    services[serviceType].splice(index, 1);
    updateServicesList(serviceType);
    updateTotal();
}

function updateTotal() {
    let total = 0;
    
    // Add diagnosis charges
    diagnoses.forEach(diagnosis => {
        total += diagnosis.amount;
    });
    
    // Add other service charges
    Object.values(services).forEach(serviceList => {
        serviceList.forEach(service => {
            if (service.price) {
                total += service.price;
            }
        });
    });
    
    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

async function handleFormSubmission(e) {
    e.preventDefault();
    try {
        const formData = {
            patientName: document.getElementById('patientName')?.value,
            patientDOB: document.getElementById('patientDOB')?.value,
            email: document.getElementById('email')?.value,
            insurance: document.getElementById('insurance')?.value || 'none',
            policyNumber: document.getElementById('policyNumber')?.value || '',
            diagnoses,
            services,
            total: calculateTotal()
        };

        if (!formData.patientName || !formData.patientDOB || !formData.email) {
            throw new Error('Please fill in all required fields');
        }

        if (!formData.email.includes('@')) {
            throw new Error('Please enter a valid email address');
        }

        const response = await fetch('/submit_bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
            window.currentBillId = data.bill_id;
            showPaymentModal(formData.total);
        } else {
            throw new Error(data.error || 'Failed to submit bill');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function calculateTotal() {
    let total = 0;
    
    // Add diagnosis charges
    diagnoses.forEach(diagnosis => {
        total += diagnosis.amount;
    });
    
    // Add service charges
    Object.values(services).forEach(serviceList => {
        serviceList.forEach(service => {
            if (service.price) {
                total += service.price;
            }
        });
    });
    
    return total;
}

// Add download PDF functionality
function downloadBillPdf(billId) {
    if (!billId) {
        console.error('Invalid bill ID');
        return;
    }
    window.open(`/download_bill_pdf/${billId}`, '_blank');
}

// Expose necessary functions to window
window.addManualService = addManualService;
window.removeService = removeService;
window.addManualDiagnosis = addManualDiagnosis;
window.removeDiagnosis = removeDiagnosis;
window.downloadBillPdf = downloadBillPdf;

window.clearForm = function() {
    if (document.getElementById('patientName')) document.getElementById('patientName').value = '';
    if (document.getElementById('patientDOB')) document.getElementById('patientDOB').value = '';
    if (document.getElementById('insurance')) document.getElementById('insurance').value = '';
    if (document.getElementById('policyNumber')) document.getElementById('policyNumber').value = '';
    if (document.getElementById('email')) document.getElementById('email').value = '';
    
    diagnoses = [];
    services = {
        labs: [],
        radiology: [],
        procedures: [],
        other: [],
        charges: []
    };
    
    updateDiagnosesList();
    Object.keys(services).forEach(type => updateServicesList(type));
    updateTotal();
};
