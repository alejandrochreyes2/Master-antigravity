document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const passwordDisplay = document.getElementById('passwordDisplay');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    
    const uppercaseCb = document.getElementById('uppercaseCb');
    const lowercaseCb = document.getElementById('lowercaseCb');
    const numbersCb = document.getElementById('numbersCb');
    const symbolsCb = document.getElementById('symbolsCb');
    
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const toggleBtn = document.getElementById('toggleBtn');
    const iconEye = document.getElementById('iconEye');
    
    const strengthText = document.getElementById('strengthText');
    const strengthBars = document.getElementById('strengthBars');

    // --- State ---
    let currentPassword = '';
    let isHiddenMode = false;

    // --- Character Sets ---
    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    // --- Initialization ---
    // Update slider visually initially
    updateSliderVisuals();
    
    // --- Event Listeners ---
    lengthSlider.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
        updateSliderVisuals();
    });

    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        generatePassword();
    });

    copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        copyToClipboard();
    });

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePasswordVisibility();
    });

    // Prevent turning off all checkboxes
    const checkboxes = [uppercaseCb, lowercaseCb, numbersCb, symbolsCb];
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checkedCount = checkboxes.filter(box => box.checked).length;
            if (checkedCount === 0) {
                // If all unchecked, force this one back to checked
                cb.checked = true;
                visualError(cb.nextElementSibling); // the checkmark span
            }
        });
    });

    // --- Functions ---
    function updateSliderVisuals() {
        const val = lengthSlider.value;
        const min = lengthSlider.min || 8;
        const max = lengthSlider.max || 32;
        const percentage = ((val - min) * 100) / (max - min);
        // Fill the slider track logically using gradient background
        lengthSlider.style.background = `linear-gradient(to right, var(--primary-light) ${percentage}%, var(--bg-surface-dark) ${percentage}%)`;
    }

    function visualError(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    }

    function generatePassword() {
        let charPool = '';
        let typesCount = 0;
        
        // Build character pool based on selected options
        if (uppercaseCb.checked) {
            charPool += CHAR_SETS.uppercase;
            typesCount++;
        }
        if (lowercaseCb.checked) {
            charPool += CHAR_SETS.lowercase;
            typesCount++;
        }
        if (numbersCb.checked) {
            charPool += CHAR_SETS.numbers;
            typesCount++;
        }
        if (symbolsCb.checked) {
            charPool += CHAR_SETS.symbols;
            typesCount++;
        }

        const length = parseInt(lengthSlider.value, 10);
        let password = '';
        
        // Guarantee at least one character from each selected pool
        if (uppercaseCb.checked) password += getRandomChar(CHAR_SETS.uppercase);
        if (lowercaseCb.checked) password += getRandomChar(CHAR_SETS.lowercase);
        if (numbersCb.checked) password += getRandomChar(CHAR_SETS.numbers);
        if (symbolsCb.checked) password += getRandomChar(CHAR_SETS.symbols);

        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += getRandomChar(charPool);
        }

        // Shuffle the resulting password string
        currentPassword = shuffleString(password);
        
        // Update display
        renderPassword();
        
        // Update strength
        updateStrength(length, typesCount);
        
        // Show generated toast and auto copy to clipboard
        showToast('Contraseña generada correctamente');
        copyToClipboard();
    }

    function getRandomChar(str) {
        // Secure random number generation if crypto is available, fallback to Math.random
        if (window.crypto && window.crypto.getRandomValues) {
            const randomArray = new Uint32Array(1);
            window.crypto.getRandomValues(randomArray);
            return str[randomArray[0] % str.length];
        } else {
            return str[Math.floor(Math.random() * str.length)];
        }
    }

    function shuffleString(str) {
        const array = str.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(getRandomNumber() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }

    function getRandomNumber() {
        if (window.crypto && window.crypto.getRandomValues) {
            const randomArray = new Uint32Array(1);
            window.crypto.getRandomValues(randomArray);
            return randomArray[0] / (0xffffffff + 1);
        } else {
            return Math.random();
        }
    }

    function renderPassword() {
        passwordDisplay.classList.remove('placeholder');
        if (isHiddenMode) {
            passwordDisplay.textContent = '•'.repeat(currentPassword.length);
        } else {
            passwordDisplay.textContent = currentPassword;
        }
    }

    function togglePasswordVisibility() {
        if (!currentPassword) return; // Do nothing if there's no password generated yet
        
        isHiddenMode = !isHiddenMode;
        
        if (isHiddenMode) {
            passwordDisplay.classList.add('hidden-mode');
            // Change icon to Eye (Not hidden physically via SVG update without innerHTML)
            while(iconEye.firstChild) {
                iconEye.removeChild(iconEye.firstChild);
            }
            // Add Eye path
            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '3');
            iconEye.appendChild(path1);
            iconEye.appendChild(circle);
        } else {
            passwordDisplay.classList.remove('hidden-mode');
            // Change icon to Eye-off
            while(iconEye.firstChild) {
                iconEye.removeChild(iconEye.firstChild);
            }
            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('d', 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '1');
            line.setAttribute('y1', '1');
            line.setAttribute('x2', '23');
            line.setAttribute('y2', '23');
            iconEye.appendChild(path1);
            iconEye.appendChild(line);
        }
        
        renderPassword();
    }

    function updateStrength(length, typesCount) {
        // Reset classes
        strengthBars.className = 'strength-bars';
        let strengthValue = 0;
        
        // Super simple scoring algorithm based on rules:
        if (length >= 8 && length < 10) strengthValue = 1;      // weak by default if too short
        else if (length >= 10 && length < 14) strengthValue = 2;
        else if (length >= 14 && length < 18) strengthValue = 3;
        else if (length >= 18) strengthValue = 4;

        // adjust by complexity
        if (typesCount === 1) strengthValue = Math.min(strengthValue, 1);
        if (typesCount === 2) strengthValue = Math.min(strengthValue, 2);
        if (typesCount === 3) strengthValue = Math.min(strengthValue, 3);
        if (typesCount === 4) strengthValue = Math.max(strengthValue, 3);
        
        if (length >= 16 && typesCount === 4) strengthValue = 4;
        
        // update UI
        let text = '';
        strengthText.className = 'strength-text';
        
        if (strengthValue === 1) {
            text = 'Débil';
            strengthText.classList.add('text-danger');
        } else if (strengthValue === 2) {
            text = 'Media';
            strengthText.classList.add('text-warning');
        } else if (strengthValue === 3) {
            text = 'Buena';
            strengthText.classList.add('text-good');
        } else if (strengthValue === 4) {
            text = 'Fuerte';
            strengthText.classList.add('text-strong');
        }

        strengthText.textContent = text;
        strengthBars.classList.add(`strength-${strengthValue}`);
    }

    async function copyToClipboard() {
        if (!currentPassword) return;

        try {
            await navigator.clipboard.writeText(currentPassword);
            showToast('Contraseña copiada correctamente');
        } catch (err) {
            console.error('Failed to copy password: ', err);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = currentPassword;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Contraseña copiada correctamente');
        }
    }

    function showToast(message) {
        // Find or create container
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create new toast notification element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger reflow so the browser catches the initial state before adding 'show'
        void toast.offsetWidth;
        toast.classList.add('show');
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            
            // Remove from DOM after CSS transition finishes
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        }, 5000);
    }
});
