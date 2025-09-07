
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarCollapseToggle = document.getElementById('sidebar-collapse-toggle');
    const mainSidebarClose = document.getElementById('main-sidebar-close');
    const chatSidebar = document.getElementById('chat-sidebar');
    const chatSidebarToggle = document.getElementById('chat-sidebar-toggle');
    const chatSidebarOverlay = document.getElementById('chat-sidebar-overlay');
    const chatCollapseToggle = document.getElementById('chat-collapse-toggle');
    const chatSidebarClose = document.getElementById('chat-sidebar-close');
    const contentMain = document.querySelector('.content-main');
    const blurredHeader = document.getElementById('blurred-header');
    const sidebarContainer = document.getElementById('sidebar-container');
    const themeButton = document.getElementById('theme-toggle-header');
    const authButton = document.getElementById('auth');
    
    /**
     * Sauvegarde l'état actuel des sidebars dans le localStorage.
     */
    function saveSidebarState() {
        if (sidebar) {
            const isOpen = !sidebar.classList.contains('-translate-x-full') && !sidebar.classList.contains('closed');
            localStorage.setItem('sidebarState', isOpen ? 'open' : 'closed');
        }
        if (chatSidebar) {
            const isOpen = !chatSidebar.classList.contains('translate-x-full') && !chatSidebar.classList.contains('closed');
            localStorage.setItem('chatSidebarState', isOpen ? 'open' : 'closed');
        }
    }

    // Enable/disable sidebar buttons
    function setSidebarButtonsState(sidebarElement, enable) {
        if (!sidebarElement) return;
        const buttons = sidebarElement.querySelectorAll('button, a[role="button"], .sidebar-item');
        buttons.forEach(button => {
            button.disabled = !enable;
            button.classList.toggle('opacity-50', !enable);
            button.classList.toggle('cursor-not-allowed', !enable);
            button.classList.toggle('pointer-events-none', !enable);
            button.setAttribute('tabindex', enable ? '0' : '-1');
        });
    }


function openSidebar(sidebarElement, overlayElement, isChat = false) {
    if (!sidebarElement) return;
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
        const hideClass = isChat ? 'translate-x-full' : '-translate-x-full';
        sidebarElement.classList.remove(hideClass);
        sidebarElement.classList.add('transition-all', 'duration-500', 'ease-in-out');

        sidebarElement.style.width = isChat ? '19rem' : '19rem';
        sidebarElement.style.minWidth = isChat ? '19rem' : '19rem';
        sidebarElement.style.opacity = '1';
        sidebarElement.style.pointerEvents = 'auto';

        // Add style classes and handle dark/light mode
        sidebarElement.classList.add('bg-sidebar-light', 'backdrop-blur-xl', 'shadow-2xl');
        
        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark') || 
                           document.body.classList.contains('dark');
        
        if (isDarkMode) {
            sidebarElement.classList.add('dark:bg-sidebar-dark');
        } else {
            sidebarElement.classList.remove('dark:bg-sidebar-dark');
        }

        // Ensure opacity and pointer events for smooth appearance
        sidebarElement.style.opacity = '1';
        sidebarElement.style.pointerEvents = 'auto';

        if (overlayElement) {
            overlayElement.classList.remove('hidden');
            overlayElement.classList.add('transition-opacity', 'duration-500', 'ease-in-out');
            overlayElement.style.opacity = '1';
        }
    } else {
        sidebarElement.classList.remove('collapsed', 'closed');
        sidebarElement.style.width = isChat ? '19rem' : '19rem';
        sidebarElement.style.minWidth = isChat ? '19rem' : '19rem';
        sidebarElement.style.opacity = '1';
        sidebarElement.style.pointerEvents = 'auto';
        sidebarElement.classList.add('transition-all', 'duration-500', 'ease-in-out');
    }

    setSidebarButtonsState(sidebarElement, true);

    if (isChat) {
        document.body.classList.add('chat-sidebar-open');
        if (chatSidebarToggle) {
            // Animate button transitions
            chatSidebarToggle.classList.add('transition-all', 'duration-300', 'ease-in-out');
            chatSidebarToggle.classList.add('chat-closed');
            chatSidebarToggle.classList.remove('chat-open');

            themeButton.classList.add('transition-all', 'duration-300', 'ease-in-out');
            themeButton.classList.add('chat-closed');
            themeButton.classList.remove('chat-open');

            authButton.classList.add('transition-all', 'duration-300', 'ease-in-out');
            authButton.classList.add('chat-closed');
            authButton.classList.remove('chat-open');
        }
    } else {
        document.body.classList.add('sidebar-open');
        if (sidebarToggle) {
            sidebarToggle.classList.add('transition-all', 'duration-300', 'ease-in-out');
            sidebarToggle.classList.add('chat-closed');
            sidebarToggle.classList.remove('chat-open');

            if (isMobile) {
                sidebarToggle.classList.add('hidden');
            }
        }
    }

    updateContentLayout();
    updateHeaderVisibility();
    saveSidebarState();
}

function closeSidebar(sidebarElement, overlayElement, isChat = false) {
    if (!sidebarElement) return;
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
        const hideClass = isChat ? 'translate-x-full' : '-translate-x-full';
        sidebarElement.classList.add(hideClass);
        sidebarElement.classList.add('transition-all', 'duration-500', 'ease-in-out');

        // Remove style classes, including dark mode
        sidebarElement.classList.remove('bg-sidebar-light', 'backdrop-blur-xl', 'shadow-2xl', 'dark:bg-sidebar-dark');

        // Fade out
        sidebarElement.style.opacity = '0';
        sidebarElement.style.pointerEvents = 'none';

        if (overlayElement) {
            overlayElement.classList.add('transition-opacity', 'duration-500', 'ease-in-out');
            overlayElement.style.opacity = '0';
            setTimeout(() => {
                overlayElement.classList.add('hidden');
            }, 500);
        }
    } else {
        sidebarElement.style.width = '0';
        sidebarElement.style.minWidth = '0';
        sidebarElement.style.opacity = '0';
        sidebarElement.style.pointerEvents = 'none';
        sidebarElement.classList.add('transition-all', 'duration-500', 'ease-in-out');

        setTimeout(() => {
            sidebarElement.classList.add('collapsed');
        }, 500);
    }

    sidebarElement.classList.add('closed');
    setSidebarButtonsState(sidebarElement, false);

    if (isChat) {
        document.body.classList.remove('chat-sidebar-open');
        if (chatSidebarToggle) {
            // Animate button transitions
            chatSidebarToggle.classList.add('transition-all', 'duration-300', 'ease-in-out');
            chatSidebarToggle.classList.remove('chat-closed');
            chatSidebarToggle.classList.add('chat-open');

            themeButton.classList.add('transition-all', 'duration-300', 'ease-in-out');
            themeButton.classList.remove('chat-closed');
            themeButton.classList.add('chat-open');

            authButton.classList.add('transition-all', 'duration-300', 'ease-in-out');
            authButton.classList.remove('chat-closed');
            authButton.classList.add('chat-open');
        }
    } else {
        document.body.classList.remove('sidebar-open');
        if (sidebarToggle) {
            sidebarToggle.classList.add('transition-all', 'duration-300', 'ease-in-out');
            sidebarToggle.classList.remove('chat-closed');
            sidebarToggle.classList.add('chat-open');

            sidebarToggle.classList.remove('hidden');
        }
    }

    updateContentLayout();
    updateHeaderVisibility();
    saveSidebarState();
}

function updateContentLayout() {
    if (!contentMain) return;

    const isMobile = window.innerWidth < 1024;
    const grid = document.querySelector('.reason');

    contentMain.style.transition = 'margin-left 0.5s ease-in-out, margin-right 0.5s ease-in-out, width 0.5s ease-in-out, padding 0.5s ease-in-out, border-radius 0.5s ease-in-out';
    
    contentMain.classList.remove('rounded-l-2xl', 'rounded-r-2xl', 'rounded-l-[28px]', 'rounded-r-[28px]', 'border-r', 'border-white/20', 'dark:border-[#3E3E3A]/50', 'rounded-[28px]');
    contentMain.style.padding = '0';

    if (isMobile) {
        contentMain.style.marginLeft = '0';
        contentMain.style.marginRight = '0';
        contentMain.style.width = '100%';

        if (grid) {
            grid.classList.remove('md:grid-cols-3');
            grid.classList.add('grid-cols-1');
        }
        return;
    }

    const leftSidebarOpen = isSidebarOpen(sidebar);
    const rightSidebarOpen = isSidebarOpen(chatSidebar);

    const leftSidebarWidth = leftSidebarOpen ? (sidebar?.offsetWidth || 304) : 0;
    const rightSidebarWidth = rightSidebarOpen ? (chatSidebar?.offsetWidth || 304) : 0;
    const availableWidth = window.innerWidth - leftSidebarWidth - rightSidebarWidth;

    contentMain.style.marginLeft = `${leftSidebarWidth}px`;
    contentMain.style.marginRight = `${rightSidebarWidth}px`;
    contentMain.style.width = `${availableWidth}px`;

    if (leftSidebarOpen || rightSidebarOpen) {
        // Dynamically set padding based on open sidebars
        let paddingLeft = leftSidebarOpen ? '0px' : '6px';
        let paddingRight = rightSidebarOpen ? '0px' : '6px';
        contentMain.style.padding = `6px ${paddingRight} 6px ${paddingLeft}`;
        contentMain.classList.add('rounded-[28px]', 'border-r', 'border-white/20', 'dark:border-[#3E3E3A]/50');

        if (leftSidebarOpen && !rightSidebarOpen) {
            contentMain.classList.add('rounded-l-[28px]');
            contentMain.classList.remove('rounded-r-[28px]');
        } else if (rightSidebarOpen && !leftSidebarOpen) {
            contentMain.classList.add('rounded-r-[28px]');
            contentMain.classList.remove('rounded-l-[28px]');
        } else if (leftSidebarOpen && rightSidebarOpen) {
            contentMain.classList.add('rounded-l-[28px]', 'rounded-r-[28px]');
        }
    }

    if (availableWidth < 800) {
        if (grid) {
            grid.classList.remove('md:grid-cols-3');
            grid.classList.add('grid-cols-1');
        }
    } else {
        if (grid) {
            grid.classList.remove('grid-cols-1');
            grid.classList.add('md:grid-cols-3');
        }
    }
}

function isSidebarOpen(sidebarElement) {
    if (!sidebarElement) return false;
    if (window.innerWidth < 1024) {
        return !sidebarElement.classList.contains(sidebarElement === sidebar ? '-translate-x-full' : 'translate-x-full');
    } else {
        return sidebarElement.style.width === '19rem';
    }
}

// Ensure layout updates on resize for smooth transitions
window.addEventListener('resize', updateContentLayout);

    // Toggle main sidebar
    function toggleSidebar() {
        if (!sidebar || !sidebarOverlay) return;
        if (isSidebarOpen(sidebar)) {
            closeSidebar(sidebar, sidebarOverlay, false);
        } else {
            if (window.innerWidth < 1024 && isSidebarOpen(chatSidebar)) {
                closeSidebar(chatSidebar, chatSidebarOverlay, true);
            }
            openSidebar(sidebar, sidebarOverlay, false);
        }
    }

    // Toggle chat sidebar
    function toggleChatSidebar() {
        if (!chatSidebar || !chatSidebarOverlay) return;
        if (isSidebarOpen(chatSidebar)) {
            closeSidebar(chatSidebar, chatSidebarOverlay, true);
        } else {
            if (window.innerWidth < 1024 && isSidebarOpen(sidebar)) {
                closeSidebar(sidebar, sidebarOverlay, false);
            }
            openSidebar(chatSidebar, chatSidebarOverlay, true);
        }
    }

    // Toggle sidebar collapse (desktop)
    function toggleSidebarCollapse() {
        if (!sidebar || window.innerWidth < 1024) return;
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
            openSidebar(sidebar, sidebarOverlay, false);
        } else {
            closeSidebar(sidebar, sidebarOverlay, false);
        }
    }

    // Toggle chat sidebar collapse (desktop)
    function toggleChatCollapse() {
        if (!chatSidebar || window.innerWidth < 1024) return;
        const isCollapsed = chatSidebar.classList.contains('collapsed');
        if (isCollapsed) {
            openSidebar(chatSidebar, chatSidebarOverlay, true);
        } else {
            closeSidebar(chatSidebar, chatSidebarOverlay, true);
        }
    }







    // Update header visibility
    function updateHeaderVisibility() {
        if (!blurredHeader) return;
        const isMobile = window.innerWidth < 1024;
        blurredHeader.classList.toggle('hidden', isMobile && (isSidebarOpen(sidebar) || isSidebarOpen(chatSidebar)));
    }

    // Update app buttons visibility
    function updateAppButtonsVisibility() {
        const isMobile = window.innerWidth < 1024;
        if (isMobile) {
            if (sidebarToggle) sidebarToggle.classList.toggle('hidden', isSidebarOpen(sidebar));
            if (chatSidebarToggle) {
                chatSidebarToggle.classList.toggle('chat-closed', isSidebarOpen(chatSidebar));
                chatSidebarToggle.classList.toggle('chat-open', !isSidebarOpen(chatSidebar));
            }
        }
    }

    /**
     * Affiche un niveau spécifique dans le sidebar avec une transition fluide.
     */
    function showSidebarLevel(level) {

        if (!sidebarContainer) return;

        const levels = sidebarContainer.querySelectorAll('[data-level]');
        levels.forEach(l => {
            l.classList.add('hidden');
            l.style.opacity = '0';
            l.style.transform = 'translateX(100%)';
            l.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        });

        const targetLevel = sidebarContainer.querySelector(`[data-level="${level}"]`);
        if (targetLevel) {
            targetLevel.classList.remove('hidden');
            setTimeout(() => {
                targetLevel.style.opacity = '1';
                targetLevel.style.transform = 'translateX(0)';
            }, 10);

            // Réinitialiser les listes déroulantes ouvertes
            targetLevel.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.add('hidden');
                dropdown.style.maxHeight = '0';
                const button = dropdown.previousElementSibling?.querySelector('.level-dropdown-toggle');
                if (button) {
                    const icon = button.querySelector('i') || button.querySelector('svg');
                    if (icon) {
                        if (icon.tagName.toLowerCase() === 'i') {
                            icon.classList.remove('fa-chevron-up', 'rotate-180');
                            icon.classList.add('fa-chevron-down');
                        } else {
                            icon.classList.remove('rotate-180');
                        }
                    }
                    button.setAttribute('aria-expanded', 'false');
                }
            });

            // Mettre à jour le titre dynamiquement
            const titleElement = targetLevel.querySelector('h4');
            if (titleElement) {
                titleElement.textContent = targetLevel.getAttribute('data-parent-name') || 'Menu';
            }
        }
    }

   


    // Go back to previous level
    function goBack() {
        if (!sidebarContainer) return;
        const history = JSON.parse(localStorage.getItem('sidebarHistory') || '["main"]');
        if (history.length <= 1) return;
        history.pop();
        const previousLevel = history[history.length - 1];
        showSidebarLevel(previousLevel);
        localStorage.setItem('sidebarHistory', JSON.stringify(history));
    }

    // Go back to main menu
    function goBackToMain() {
        if (!sidebarContainer) return;
        showSidebarLevel('main');
        localStorage.setItem('sidebarHistory', JSON.stringify(['main']));
    }

    /**
     * Bascule l'état d'une liste déroulante avec transitions fluides.
     */
    function toggleDropdown(button, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const isOpen = !dropdown.classList.contains('hidden');
        const icon = button.querySelector('i') || button.querySelector('svg');

        if (isOpen) {
            // Fermer la liste déroulante
            dropdown.style.transition = 'max-height 0.5s ease-in-out';
            dropdown.style.maxHeight = '0';
            setTimeout(() => {
                dropdown.classList.add('hidden');
                dropdown.style.transition = '';
            }, 500);
            if (icon) {
                if (icon.tagName.toLowerCase() === 'i') {
                    icon.classList.remove('fa-chevron-up', 'rotate-180');
                    icon.classList.add('fa-chevron-down');
                } else {
                    icon.classList.remove('rotate-180');
                }
            }
            button.setAttribute('aria-expanded', 'false');
        } else {
            // Fermer toutes les autres listes déroulantes au même niveau
            const parent = button.closest('[data-level]');
            parent.querySelectorAll('.dropdown-content').forEach(otherDropdown => {
                if (otherDropdown !== dropdown && !otherDropdown.classList.contains('hidden')) {
                    otherDropdown.style.transition = 'max-height 0.5s ease-in-out';
                    otherDropdown.style.maxHeight = '0';
                    setTimeout(() => {
                        otherDropdown.classList.add('hidden');
                        otherDropdown.style.transition = '';
                    }, 500);
                    const otherButton = otherDropdown.previousElementSibling.querySelector('.level-dropdown-toggle');
                    if (otherButton) {
                        const otherIcon = otherButton.querySelector('i') || otherButton.querySelector('svg');
                        if (otherIcon) {
                            if (otherIcon.tagName.toLowerCase() === 'i') {
                                otherIcon.classList.remove('fa-chevron-up', 'rotate-180');
                                otherIcon.classList.add('fa-chevron-down');
                            } else {
                                otherIcon.classList.remove('rotate-180');
                            }
                        }
                        otherButton.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            // Ouvrir la liste déroulante
            dropdown.classList.remove('hidden');
            dropdown.style.transition = 'max-height 0.5s ease-in-out';
            dropdown.style.maxHeight = `${dropdown.scrollHeight}px`;
            if (icon) {
                if (icon.tagName.toLowerCase() === 'i') {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up', 'rotate-180');
                } else {
                    icon.classList.add('rotate-180');
                }
            }
            button.setAttribute('aria-expanded', 'true');
            setTimeout(() => {
                dropdown.style.transition = '';
            }, 500);
        }
    }

    // Initialize sidebars
    function initializeSidebars() {
        const sidebarState = localStorage.getItem('sidebarState');
        const chatSidebarState = localStorage.getItem('chatSidebarState');
        const isMobile = window.innerWidth < 1024;

        // Initialize hidden
        if (sidebar) {
            sidebar.classList.add('-translate-x-full', 'closed');
            setSidebarButtonsState(sidebar, false);
            if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
            sidebar.style.width = '0';
            sidebar.style.minWidth = '0';
            sidebar.style.opacity = '0';
            sidebar.style.pointerEvents = 'none';
        }

        if (chatSidebar) {
            chatSidebar.classList.add('translate-x-full', 'closed');
            setSidebarButtonsState(chatSidebar, false);
            if (chatSidebarOverlay) chatSidebarOverlay.classList.add('hidden');
            chatSidebar.style.width = '0';
            chatSidebar.style.minWidth = '0';
            chatSidebar.style.opacity = '0';
            chatSidebar.style.pointerEvents = 'none';
        }

        // Apply saved state
        setTimeout(() => {
            if (sidebar) {
                if (sidebarState === 'open') {
                    openSidebar(sidebar, sidebarOverlay, false);
                } else {
                    closeSidebar(sidebar, sidebarOverlay, false);
                }
            }

            if (chatSidebar) {
                if (chatSidebarState === 'open') {
                    openSidebar(chatSidebar, chatSidebarOverlay, true);
                } else {
                    closeSidebar(chatSidebar, chatSidebarOverlay, true);
                }
            }
            /*

            if (sidebarContainer) {
                const history = JSON.parse(localStorage.getItem('sidebarHistory') || '["main"]');
                alert(history[history.length - 1]);
                showSidebarLevel(history[history.length - 1]);
            }
                */

            if (sidebarContainer) {
    localStorage.setItem('sidebarHistory', JSON.stringify(['main']));
    showSidebarLevel('main');
}


            updateContentLayout();
            updateHeaderVisibility();
            updateAppButtonsVisibility();
        }, 100);
    }

   
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
    if (sidebarCollapseToggle) sidebarCollapseToggle.addEventListener('click', toggleSidebarCollapse);
    if (mainSidebarClose) mainSidebarClose.addEventListener('click', toggleSidebar);
    if (chatSidebarToggle) chatSidebarToggle.addEventListener('click', toggleChatSidebar);
    if (chatSidebarOverlay) chatSidebarOverlay.addEventListener('click', toggleChatSidebar);
    if (chatCollapseToggle) chatCollapseToggle.addEventListener('click', toggleChatCollapse);
    if (chatSidebarClose) chatSidebarClose.addEventListener('click', toggleChatSidebar);

   
    document.querySelectorAll('[data-navigate]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const level = button.getAttribute('data-navigate');
            const history = JSON.parse(localStorage.getItem('sidebarHistory') || '["main"]');
            history.push(level);
            localStorage.setItem('sidebarHistory', JSON.stringify(history));
            showSidebarLevel(level);
        });
    });

    // Boutons de retour
    document.querySelectorAll('[data-back]').forEach(button => {
        button.addEventListener('click', goBack);
    });

    document.querySelectorAll('[data-back-to-main]').forEach(button => {
        button.addEventListener('click', goBackToMain);
    });

    // Gestion des listes déroulantes pour tous les niveaux
    document.querySelectorAll('.level-dropdown-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const levelId = button.getAttribute('data-level-id');
            toggleDropdown(button, `level-dropdown-${levelId}`);
        });
    });

    // Tooltip management
    document.querySelectorAll('.sidebar-item, [title]').forEach(element => {
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

    // Fermer les dropdowns en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(dropdown => {
            if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && !dropdown.previousElementSibling.contains(e.target)) {
                dropdown.style.maxHeight = '0';
                setTimeout(() => dropdown.classList.add('hidden'), 500);
                const button = dropdown.previousElementSibling.querySelector('.level-dropdown-toggle');
                if (button) {
                    const icon = button.querySelector('i') || button.querySelector('svg');
                    if (icon) {
                        if (icon.tagName.toLowerCase() === 'i') {
                            icon.classList.remove('fa-chevron-up', 'rotate-180');
                            icon.classList.add('fa-chevron-down');
                        } else {
                            icon.classList.remove('rotate-180');
                        }
                    }
                    button.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

    // Window resize handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initializeSidebars();
            if (sidebarContainer) {
                const history = JSON.parse(localStorage.getItem('sidebarHistory') || '["main"]');
                showSidebarLevel(history[history.length - 1]);
            }
        }, 100);
    });


        /**
         * Ouvre le modal d'édition avec les valeurs appropriées selon le champ à modifier.
         * @param {string} field - Le champ à éditer (name, email, address, preferences)
         */
        function openEditModal(field) {
            const modal = document.getElementById('edit-modal');
            const input = document.getElementById('modal-input');
            const label = document.getElementById('modal-label');
            const profileDetails = document.querySelector('[data-level="profile-details"]');

            if (!modal || !input || !label || !profileDetails) {
                console.error("Certains éléments requis pour le modal sont introuvables.");
                return;
            }

            // Réinitialiser l'input
            input.type = 'text';
            input.checked = false;
            input.value = '';

            let labelText = '';
            let currentValue = '';

            try {
                switch (field) {
                    case 'name':
                        labelText = 'Nom';
                        currentValue = profileDetails.querySelector('h3')?.textContent || '';
                        break;
                    case 'email':
                        labelText = 'Email';
                        currentValue = profileDetails.querySelector('p.text-sm.text-white\\/90')?.textContent || '';
                        break;
                    case 'address':
                        labelText = 'Adresse';
                        currentValue = profileDetails.querySelector('div:nth-child(3) p.text-sm.text-white\\/90')?.textContent || '';
                        break;
                    case 'preferences':
                        labelText = 'Notifications';
                        currentValue = profileDetails.querySelector('#notifications-status')?.textContent || '';
                        input.type = 'checkbox';
                        input.checked = currentValue.trim().toLowerCase() === 'activées';
                        break;
                    default:
                        console.warn(`Champ inconnu : ${field}`);
                        return;
                }

                label.textContent = labelText;

                if (field !== 'preferences') {
                    input.value = currentValue.trim();
                }

                // Ouvrir le modal
                modal.classList.remove('hidden');
                setTimeout(() => {
                    modal.querySelector('div')?.classList.replace('scale-95', 'scale-100');
                }, 10);
            } catch (error) {
                console.error("Erreur lors de l'ouverture du modal :", error);
            }
        }

        /**
         * Ferme le modal d'édition proprement
         */
        function closeEditModal() {
            const modal = document.getElementById('edit-modal');
            const input = document.getElementById('modal-input');

            if (!modal || !input) {
                console.error("Impossible de fermer le modal, éléments manquants.");
                return;
            }

            const modalContent = modal.querySelector('div');
            if (modalContent) {
                modalContent.classList.replace('scale-100', 'scale-95');
            }

            setTimeout(() => {
                modal.classList.add('hidden');
                input.type = 'text'; // Réinitialiser pour éviter des conflits futurs
                input.checked = false;
                input.value = '';
            }, 300);
        }

        /**
         * Initialise les événements sur les boutons d'édition et modal
         */
        function initEditModalHandlers() {
            // Boutons pour ouvrir le modal
            document.querySelectorAll('[data-edit]').forEach(button => {
                button.addEventListener('click', () => {
                    const field = button.getAttribute('data-edit');
                    if (field) {
                        openEditModal(field);
                    }
                });
            });

            // Bouton pour annuler (fermer)
            document.getElementById('modal-cancel')?.addEventListener('click', closeEditModal);

            // Bouton pour enregistrer (tu peux ajouter ici la logique de sauvegarde)
            document.getElementById('modal-save')?.addEventListener('click', () => {
                // Exemple : tu peux récupérer la valeur ici pour l’envoyer à un serveur
                const input = document.getElementById('modal-input');
                const value = input.type === 'checkbox' ? input.checked : input.value.trim();
                console.log("Valeur à sauvegarder :", value);

                // TODO : ajouter logique de sauvegarde ici (ex. API, mise à jour DOM, etc.)

                closeEditModal();
            });
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', initEditModalHandlers);



const showNotification = async (message, type = 'info', isToast = true, options = {}) => {
  const iconMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

     const swalOptions = {
    icon: iconMap[type] || 'info',
    title: message,
    timer: isToast ? 5000 : undefined,
    timerProgressBar: isToast,
    showConfirmButton: !isToast,
    confirmButtonText: 'Okay',
    position: isToast ? 'top-end' : 'center',
    toast: isToast,
    didOpen: (popup) => {
    popup.style.fontSize = '14px';
  },
    ...options,
  };
  await Swal.fire(swalOptions);
};

    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            switch (action) {
                case 'new-chat':
                    showNotification('Nouvelle discussion (fonctionnalité à implémenter)', 'info');
                    break;
                case 'archived-chats':
                    showNotification('Discussions archivées (fonctionnalité à implémenter)', 'info');
                    break;
                case 'chat-settings':
                    showNotification('Paramètres de discussion (fonctionnalité à implémenter)', 'info');
                    break;
            }
        });
    });

    
   

    // Initialize
    initializeSidebars();
});
