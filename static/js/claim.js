document.addEventListener('DOMContentLoaded', function() {
    const claimForm = document.getElementById('claimForm');
    if (claimForm) {
        setupClaimForm();
        populateBillData();
    }
});

function setupClaimForm() {
    const claimForm = document.getElementById('claimForm');
    claimForm.addEventListener('submit', handleClaimSubmission);
}

async function populateBillData() {
    const urlParams = new URLSearchParams(window.location.search);
    const billId = urlParams.get('billId');
    
    if (!billId) {
        console.error('No bill ID provided');
        return;
    }

    try {
        const response = await fetch(`/api/bills/${billId}`);
        if (!response.ok) throw new Error('Failed to fetch bill data');
        
        const data = await response.json();
        if (data.success) {
            populateDiagnosisCodes(data.bill.diagnoses);
            populateProcedureCodes(data.bill.procedures);
            
            // Pre-fill subscriber information if available
            if (data.bill.patient_name) {
                document.getElementById('subscriberName').value = data.bill.patient_name;
            }
            if (data.bill.patient_dob) {
                document.getElementById('subscriberDOB').value = data.bill.patient_dob;
            }
            if (data.bill.insurance_provider) {
                document.getElementById('payerName').value = data.bill.insurance_provider;
            }
        }
    } catch (error) {
        console.error('Error fetching bill data:', error);
        alert('Failed to load bill data. Please try again.');
    }
}

function populateDiagnosisCodes(diagnoses) {
    const container = document.getElementById('diagnosisCodes');
    if (!container || !diagnoses) return;

    container.innerHTML = diagnoses.map((diagnosis, index) => `
        <div class="diagnosis-item mb-2">
            <div class="row">
                <div class="col-md-3">
                    <input type="text" class="form-control" value="${diagnosis.icd10_code}" readonly>
                </div>
                <div class="col-md-9">
                    <input type="text" class="form-control" value="${diagnosis.description}" readonly>
                </div>
            </div>
        </div>
    `).join('');
}

function populateProcedureCodes(procedures) {
    const container = document.getElementById('procedureCodes');
    if (!container || !procedures) return;

    container.innerHTML = procedures.map((procedure, index) => `
        <div class="procedure-item mb-2">
            <div class="row">
                <div class="col-md-3">
                    <input type="text" class="form-control" value="${procedure.cpt_code}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="text" class="form-control" value="${procedure.description}" readonly>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control" value="$${procedure.amount}" readonly>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleClaimSubmission(e) {
    e.preventDefault();
    
    const formData = {
        payerId: document.getElementById('payerId').value,
        payerName: document.getElementById('payerName').value,
        subscriberId: document.getElementById('subscriberId').value,
        subscriberName: document.getElementById('subscriberName').value,
        subscriberDOB: document.getElementById('subscriberDOB').value,
        relationshipToSubscriber: document.getElementById('relationshipToSubscriber').value,
        dateOfService: document.getElementById('dateOfService').value,
        placeOfService: document.getElementById('placeOfService').value,
        billId: new URLSearchParams(window.location.search).get('billId')
    };

    try {
        const response = await fetch('/api/submit_claim', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
            alert('Claim submitted successfully!');
            window.location.href = '/dashboard';
        } else {
            throw new Error(data.error || 'Failed to submit claim');
        }
    } catch (error) {
        console.error('Error submitting claim:', error);
        alert(error.message || 'Failed to submit claim. Please try again.');
    }
}
