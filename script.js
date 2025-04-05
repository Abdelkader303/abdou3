document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const dataForm = document.getElementById('data-form');
    
    // تحقق مما إذا كانت المحادثة قد بدأت بالفعل
    if (sessionStorage.getItem('chatStarted') === 'true') {
        return;
    }
    
    // وضع علامة أن المحادثة قد بدأت
    sessionStorage.setItem('chatStarted', 'true');
    
    let currentQuestion = 0;
    let userData = {
        password: '',
        fullName: '',
        email: '',
        subject: '',
        details: ''
    };
    
    const questions = [
        {
            text: "مرحبا بك في قسم RE لإرسال فكرتك أو غير ذلك رجاءا الجواب على الأسئلة التي تطرح عليك وشكرا",
            isWelcome: true
        },
        {
            text: "أكتب كلمة المرور بأنك عضو في قسم RE",
            field: 'password',
            validate: (value) => value.trim().toLowerCase() === 'marouam'
        },
        {
            text: "أكتب الإسم واللقب",
            field: 'fullName',
            validate: (value) => value.trim().length > 0
        },
        {
            text: "أكتب البريد الإلكتروني",
            field: 'email',
            inputType: 'email',
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        },
        {
            text: "ماهو الموضوع:",
            field: 'subject',
            isOptions: true,
            options: ['أقترح فكرة', 'أواجه مشكلة', 'موضوع آخر'],
            validate: (value) => ['أقترح فكرة', 'أواجه مشكلة', 'موضوع آخر'].includes(value)
        },
        {
            text: "إطرح الموضوع بالتفصيل",
            field: 'details',
            validate: (value) => value.trim().length > 10
        }
    ];
    
    // بدء المحادثة
    setTimeout(() => {
        addBotMessage(questions[0].text);
        setTimeout(() => askQuestion(1), 1000);
    }, 500);
    
    function addBotMessage(text, isWelcome = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        if (isWelcome) messageDiv.classList.add('welcome-message');
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user-message');
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addErrorMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'error-message');
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function askQuestion(index) {
        currentQuestion = index;
        const question = questions[index];
        
        addBotMessage(question.text);
        
        if (question.inputType) {
            userInput.type = question.inputType;
        } else {
            userInput.type = 'text';
        }
        
        userInput.placeholder = question.text;
        userInput.focus();
        
        if (question.isOptions) {
            showOptions(question.options);
            userInput.style.display = 'none';
            sendBtn.style.display = 'none';
        } else {
            userInput.style.display = 'block';
            sendBtn.style.display = 'flex';
        }
    }
    
    function showOptions(options) {
        const existingOptions = document.querySelectorAll('.options-container');
        existingOptions.forEach(option => option.remove());
        
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-container');
        
        options.forEach(option => {
            const optionBtn = document.createElement('button');
            optionBtn.classList.add('option-btn');
            optionBtn.textContent = option;
            optionBtn.addEventListener('click', () => {
                // إخفاء جميع الخيارات فورًا
                const allOptionBtns = document.querySelectorAll('.option-btn');
                allOptionBtns.forEach(btn => {
                    if (btn !== optionBtn) btn.remove();
                });
                
                addUserMessage(option);
                userData[questions[currentQuestion].field] = option;
                
                if (currentQuestion < questions.length - 1) {
                    setTimeout(() => askQuestion(currentQuestion + 1), 500);
                } else {
                    showCompletionMessage();
                }
            });
            optionsContainer.appendChild(optionBtn);
        });
        
        chatMessages.appendChild(optionsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function showCompletionMessage() {
        // تعبئة النموذج المخفي بالبيانات المجمعة
        document.getElementById('form-password').value = userData.password;
        document.getElementById('form-fullName').value = userData.fullName;
        document.getElementById('form-email').value = userData.email;
        document.getElementById('form-subject').value = userData.subject;
        document.getElementById('form-details').value = userData.details;
        
        // إرسال النموذج عبر AJAX
        const formData = new FormData(dataForm);
        
        fetch(dataForm.action, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const successDiv = document.createElement('div');
            successDiv.classList.add('success-message');
            successDiv.innerHTML = `
                تم تحويل هذا الموضوع إلى مسؤول قسم RE<br>
                سيتم الرد عليك في أقرب من طرف المسؤول وشكرا لك √
            `;
            chatMessages.appendChild(successDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(error => {
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('error-message');
            errorDiv.innerHTML = `
                حدث خطأ أثناء إرسال البيانات<br>
                يرجى المحاولة مرة أخرى لاحقاً
            `;
            chatMessages.appendChild(errorDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        
        userInput.disabled = true;
        sendBtn.disabled = true;
    }
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        addUserMessage(message);
        userInput.value = '';
        
        const currentQ = questions[currentQuestion];
        
        if (currentQ.validate && !currentQ.validate(message)) {
            if (currentQ.field === 'password') {
                addErrorMessage("كلمة المرور غير صحيحة");
            } else {
                addErrorMessage("الرجاء إدخال إجابة صحيحة");
            }
            return;
        }
        
        if (currentQ.field) {
            userData[currentQ.field] = message;
        }
        
        if (currentQuestion < questions.length - 1) {
            setTimeout(() => askQuestion(currentQuestion + 1), 500);
        } else {
            setTimeout(() => showCompletionMessage(), 1000);
        }
    }
    
    // مستمعي الأحداث
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    userInput.addEventListener('focus', function() {
        if (questions[currentQuestion].inputType === 'email') {
            this.type = 'email';
        }
    });
    
    // منع إعادة تحميل الصفحة
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
});