// chat.js - Gestion complète du chat sidebar avec navigation dynamique entre panneaux, chargement de messages, et envoi

const mockConversations = {
    1: [
        { sender: 'Marie D.', message: 'Salut, commande expédiée ?', time: '2 min ago', isSelf: false },
        { sender: 'Vous', message: 'Oui, expédiée ce matin !', time: '1 min ago', isSelf: true }
    ],
    2: [
        { sender: 'Jean M.', message: 'Merci pour le support !', time: '15 min ago', isSelf: false },
        { sender: 'Vous', message: 'De rien, heureux d\'aider !', time: '10 min ago', isSelf: true }
    ],
    3: [
        { sender: 'Sophie L.', message: 'Besoin d\'aide avec le paiement', time: '1h ago', isSelf: false },
        { sender: 'Vous', message: 'Je vérifie, je vous reviens vite.', time: '50 min ago', isSelf: true }
    ],
    4: [
        { sender: 'Pierre R.', message: 'Avis publié, 5 étoiles !', time: '2h ago', isSelf: false },
        { sender: 'Vous', message: 'Merci beaucoup !', time: '1.5h ago', isSelf: true }
    ],
    'ai': [
        { sender: 'Afrix Assistant', message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?', time: 'Just now', isSelf: false }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const chatSidebar = document.getElementById('chat-sidebar');
    const conversationPanel = document.getElementById('conversation-panel');
    const messagesPanel = document.getElementById('messages-panel');
    const chatBack = document.getElementById('chat-back');
    const messagesContainer = document.getElementById('messages-container');
    const chatUser = document.getElementById('chat-user');
    const chatForm = document.getElementById('chat-form');
    const chatMessage = document.getElementById('chat-message');
    const chatSearch = document.getElementById('chat-search');

    // Vérifie si le chat est ouvert
    function isChatSidebarOpen() {
        if (!chatSidebar) return false;
        return window.innerWidth < 1024 
            ? !chatSidebar.classList.contains('translate-x-full')
            : chatSidebar.style.width === '19rem';
    }

    // Affiche le panneau des messages avec transition
    function showMessagesPanel() {
        if (!conversationPanel || !messagesPanel) return;
        const transitionDuration = 300;
        conversationPanel.style.opacity = '0';
        conversationPanel.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            conversationPanel.classList.add('hidden');
            messagesPanel.classList.remove('hidden');
            setTimeout(() => {
                messagesPanel.style.opacity = '1';
                messagesPanel.style.transform = 'translateX(0)';
            }, 20);
        }, transitionDuration / 2);
    }

    // Affiche le panneau des conversations avec transition
    function showConversationPanel() {
        if (!conversationPanel || !messagesPanel) return;
        const transitionDuration = 300;
        messagesPanel.style.opacity = '0';
        messagesPanel.style.transform = 'translateX(20px)';
        setTimeout(() => {
            messagesPanel.classList.add('hidden');
            conversationPanel.classList.remove('hidden');
            setTimeout(() => {
                conversationPanel.style.opacity = '1';
                conversationPanel.style.transform = 'translateX(0)';
            }, 20);
        }, transitionDuration / 2);
    }

    // Charge les messages d'une conversation
    function loadMessages(conversationId, user) {
        if (!isChatSidebarOpen() || !messagesContainer || !chatUser) return;
        chatUser.textContent = user;
        messagesContainer.innerHTML = '';
        const messages = mockConversations[conversationId] || [];
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `flex ${msg.isSelf ? 'justify-end' : 'justify-start'} mb-3`;
            messageElement.innerHTML = `
                <div class="max-w-[70%] p-3 rounded-lg ${
                    msg.isSelf 
                        ? 'bg-ll-blue dark:bg-ll-dark-blue text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'
                }">
                    <p class="text-sm">${msg.message}</p>
                    <p class="text-xs opacity-70 mt-1">${msg.time}</p>
                </div>
            `;
            messagesContainer.appendChild(messageElement);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        showMessagesPanel();
    }

    // Envoie un message
    function sendMessage(conversationId, message) {
        if (!mockConversations[conversationId] || !message.trim()) return;
        mockConversations[conversationId].push({
            sender: 'Vous',
            message,
            time: 'Just now',
            isSelf: true
        });
        loadMessages(conversationId, chatUser.textContent);
        chatMessage.value = '';
        if (conversationId !== 'ai') {
            setTimeout(() => {
                const replies = [
                    'Merci pour votre message !',
                    'Je vérifie et reviens vers vous.',
                    'Tout est noté, je vous réponds bientôt.',
                    'Super, merci !'
                ];
                mockConversations[conversationId].push({
                    sender: chatUser.textContent,
                    message: replies[Math.floor(Math.random() * replies.length)],
                    time: 'Just now',
                    isSelf: false
                });
                loadMessages(conversationId, chatUser.textContent);
            }, 2000);
        } else {
            setTimeout(() => {
                mockConversations['ai'].push({
                    sender: 'Afrix Assistant',
                    message: 'Je traite votre demande : ' + message + '. Voici une réponse simulée !',
                    time: 'Just now',
                    isSelf: false
                });
                loadMessages('ai', 'Afrix Assistant');
            }, 2000);
        }
    }

    // Écouteurs
    if (chatBack) chatBack.addEventListener('click', showConversationPanel);

    document.querySelectorAll('[data-conversation-id]').forEach(button => {
        button.addEventListener('click', () => {
            const conversationId = button.getAttribute('data-conversation-id');
            const user = button.querySelector('p.font-semibold')?.textContent || 'Utilisateur';
            loadMessages(conversationId, user);
            document.querySelectorAll('[data-conversation-id]').forEach(btn => btn.classList.remove('bg-gray-200', 'dark:bg-gray-700'));
            button.classList.add('bg-gray-200', 'dark:bg-gray-700');
        });
    });

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const conversationId = document.querySelector('[data-conversation-id].bg-gray-200, [data-conversation-id].dark\\:bg-gray-700')?.getAttribute('data-conversation-id');
            if (conversationId && chatMessage.value.trim()) {
                sendMessage(conversationId, chatMessage.value);
            }
        });
    }

    if (chatSearch) {
        chatSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('[data-conversation-id]').forEach(button => {
                const user = button.querySelector('p.font-semibold')?.textContent.toLowerCase() || '';
                const message = button.querySelector('p.text-sm')?.textContent.toLowerCase() || '';
                button.style.display = (user.includes(query) || message.includes(query)) ? 'flex' : 'none';
            });
        });
    }

    // Tooltips pour conversations
    document.querySelectorAll('[data-conversation-id]').forEach(element => {
        const tooltip = element.querySelector('.tooltip');
        if (tooltip) {
            element.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
                tooltip.style.pointerEvents = 'auto';
            });
            element.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.pointerEvents = 'none';
            });
        }
    });

    // Scroll auto sur nouveaux messages avec MutationObserver
    if (messagesContainer) {
        const observer = new MutationObserver(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
        observer.observe(messagesContainer, { childList: true, subtree: false });
    }

    // Initialisation des panneaux
    if (conversationPanel && messagesPanel) {
        conversationPanel.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        messagesPanel.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        showConversationPanel();
    }
});
