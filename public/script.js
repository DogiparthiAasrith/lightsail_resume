document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    const messageDiv = document.getElementById('message');
    
    // Get form data
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('jobTitle', document.getElementById('jobTitle').value);
    formData.append('resume', document.getElementById('resume').files[0]);
    
    // Disable button and show spinner
    submitBtn.disabled = true;
    btnText.textContent = 'Uploading...';
    spinner.style.display = 'inline-block';
    messageDiv.style.display = 'none';
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Resume uploaded successfully!';
            messageDiv.style.display = 'block';
            
            // Reset form
            document.getElementById('uploadForm').reset();
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.style.display = 'block';
    } finally {
        // Re-enable button and hide spinner
        submitBtn.disabled = false;
        btnText.textContent = 'Upload Resume';
        spinner.style.display = 'none';
    }
});

// Show selected filename
document.getElementById('resume').addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name || 'No file chosen';
    const fileNameSpan = document.querySelector('.file-name');
    if (fileNameSpan) {
        fileNameSpan.textContent = fileName;
    }
});
