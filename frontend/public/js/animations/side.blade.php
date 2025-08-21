<aside id="sidebar" class="fixed top-0 left-0 h-full w-80 bg-sidebar-light dark:bg-sidebar-dark backdrop-blur-xl shadow-2xl transform -translate-x-full z-50 lg:-translate-x-0 transition-all duration-500 ease-in-out rounded-r-2xl overflow-hidden border-r border-white/20 dark:border-[#3E3E3A]/50 flex flex-col">
    <div class="relative w-full h-full">
        <!-- Sidebar Header -->
        <div class="absolute top-0 w-full p-4 z-40 bg-gradient-to-b from-sidebar-light/90 to-transparent dark:from-sidebar-dark/90 dark:to-transparent shadow-md">
            <div class="flex items-center justify-between">
                <a href="{{ url('/') }}" class="flex items-center text-2xl font-extrabold text-afrixRed dark:text-afrixRed hover:text-afrixDarkRed dark:hover:text-afrixDarkRed transition-all duration-300">
                    <img src="{{ asset('images/afrix-logo.png') }}" alt="Afrix Logo" class="h-12 w-12 mr-3 transform transition-transform duration-300 hover:scale-110 shadow-sm">
                    <span class="text-xl tracking-tight">Afrix</span>
                </a>
                <div class="flex items-center gap-2">
                    <button id="sidebar-collapse-toggle" class="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-[#2A2A2A] transition-colors focus:outline-none focus:ring-2 focus:ring-afrixRed/30 hidden lg:block" title="Réduire/Étendre le sidebar">
                        <svg viewBox="0 0 24 24" class="w-7 h-7 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300">
                            <path d="M3.75 8.5C3.75 8.08579 4.08579 7.75 4.5 7.75H5.75C6.16421 7.75 6.5 8.08579 6.5 8.5C6.5 8.91421 6.16421 9.25 5.75 9.25H4.5C4.08579 9.25 3.75 8.91421 3.75 8.5ZM3.75 12C3.75 11.5858 4.08579 11.25 4.5 11.25H5.75C6.16421 11.25 6.5 11.5858 6.5 12C6.5 12.4142 6.16421 12.75 5.75 12.75H4.5C4.08579 12.75 3.75 12.4142 3.75 12ZM3.75 15.5C3.75 15.0858 4.08579 14.75 4.5 14.75H5.75C6.16421 14.75 6.5 15.0858 6.5 15.5C6.5 15.9142 6.16421 16.25 5.75 16.25H4.5C4.08579 16.25 3.75 15.9142 3.75 15.5ZM4.25 3C2.45507 3 1 4.45507 1 6.25V17.75C1 19.5449 2.45508 21 4.25 21H19.75C21.5449 21 23 19.5449 23 17.75V6.25C23 4.45507 21.5449 3 19.75 3H4.25ZM19.75 19.5H9V4.5H19.75C20.7165 4.5 21.5 5.2835 21.5 6.25V17.75C21.5 18.7165 20.7165 19.5 19.75 19.5ZM4.25 4.5H7.5V19.5H4.25C3.2835 19.5 2.5 18.7165 2.5 17.75V6.25C2.5 5.2835 3.2835 4.5 4.25 4.5Z" fill="currentColor"></path>
                        </svg>
                    </button>
                    <button id="main-sidebar-close" class="lg:hidden p-2 rounded-lg hover:bg-[#f53003]/10 dark:hover:bg-afrixBrown transition focus:outline-none focus:ring-2 focus:ring-afrixRed/30" title="Fermer le sidebar">
                        <svg viewBox="0 0 24 24" class="w-7 h-7 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300">
                            <path d="M3.75 8.5C3.75 8.08579 4.08579 7.75 4.5 7.75H5.75C6.16421 7.75 6.5 8.08579 6.5 8.5C6.5 8.91421 6.16421 9.25 5.75 9.25H4.5C4.08579 9.25 3.75 8.91421 3.75 8.5ZM3.75 12C3.75 11.5858 4.08579 11.25 4.5 11.25H5.75C6.16421 11.25 6.5 11.5858 6.5 12C6.5 12.4142 6.16421 12.75 5.75 12.75H4.5C4.08579 12.75 3.75 12.4142 3.75 12ZM3.75 15.5C3.75 15.0858 4.08579 14.75 4.5 14.75H5.75C6.16421 14.75 6.5 15.0858 6.5 15.5C6.5 15.9142 6.16421 16.25 5.75 16.25H4.5C4.08579 16.25 3.75 15.9142 3.75 15.5ZM4.25 3C2.45507 3 1 4.45507 1 6.25V17.75C1 19.5449 2.45508 21 4.25 21H19.75C21.5449 21 23 19.5449 23 17.75V6.25C23 4.45507 21.5449 3 19.75 3H4.25ZM19.75 19.5H9V4.5H19.75C20.7165 4.5 21.5 5.2835 21.5 6.25V17.75C21.5 18.7165 20.7165 19.5 19.75 19.5ZM4.25 4.5H7.5V19.5H4.25C3.2835 19.5 2.5 18.7165 2.5 17.75V6.25C2.5 5.2835 3.2835 4.5 4.25 4.5Z" fill="currentColor"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Sidebar Content -->
        <div class="h-screen px-3 py-3 pt-20 pb-10 relative overflow-hidden">
           <div id="sidebar-container" class="t-custom-scrollbar h-full overflow-y-auto overflow-x-hidden transition-transform duration-500 ease-in-out" >
                <!-- Style de la barre de défilement personnalisée -->
                <style>
                    .t-custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .t-custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                        border-radius: 9999px;
                        margin: 8px;
                    }
                    .t-custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 48, 3, 0.5);
                        border-radius: 9999px;
                    }
                    .t-custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 48, 3, 0.8);
                    }
                </style>

                <!-- Main Level -->
                <div data-level="main" class="w-full float-left">
                    <div class="flex min-h-full w-full flex-col px-3 space-y-2">
                        @auth
                            <!-- User Profile -->
                            <div class="mb-6 p-4 bg-gradient-to-r from-afrixRed/90 to-afrixDarkRed/90 backdrop-blur-md rounded-xl text-white shadow-lg transform transition-all duration-300 hover:scale-102">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 rounded-full bg-black/50 dark:bg-black/50 flex items-center justify-center text-xl font-bold shadow-inner">
                                        {{ collect(explode(' ', Auth::user()->name))->map(fn($word) => Str::substr($word, 0, 1))->join('') }}
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-white/95 text-lg">{{ Auth::user()->name }}</h3>
                                        <p class="text-sm text-white/90">{{ Auth::user()->getRoleNames()->first() ?? 'Utilisateur' }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- General Menu -->
                            <x-sidebar-item href="{{ route('dashboard') }}" icon="fas fa-tachometer-alt" text="Tableau de bord" title="Accéder au tableau de bord" />
                            <x-sidebar-item href="{{ route('profile') }}" icon="fas fa-user" text="Mon Profil" title="Voir et modifier votre profil" />
                            <x-sidebar-item href="{{ route('cart.index') }}" icon="fas fa-shopping-cart" text="Panier" title="Voir les articles dans votre panier" />
                            <x-sidebar-item href="{{ route('wishlist.index') }}" icon="fas fa-heart" text="Liste de souhaits" title="Voir votre liste de souhaits" />
                            <x-sidebar-item href="{{ route('wishlist.index') }}" icon="fas fa-box" text="Mes Commandes" title="Voir l'historique de vos commandes" />

                            <!-- Seller Menu -->
                            @hasrole('seller')
                                <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50">
                                    <h4 class="px-4 py-2 text-xs font-bold text-afrixTextGray dark:text-afrixMediumGray uppercase tracking-widest">Vendeur</h4>
                                    <x-sidebar-item href="{{ route('seller.products') }}" icon="fas fa-box" text="Mes Produits" title="Gérer vos produits" />
                                    <x-sidebar-item href="{{ route('seller.stats') }}" icon="fas fa-chart-line" text="Statistiques" title="Voir les statistiques de vente" />
                                    <x-sidebar-item href="{{ route('seller.orders') }}" icon="fas fa-shopping-cart" text="Commandes" title="Gérer les commandes de votre boutique" />
                                    <x-sidebar-item href="{{ route('seller.shop') }}" icon="fas fa-store" text="Ma Boutique" title="Personnaliser votre boutique" />
                                    <x-sidebar-item href="{{ route('seller.promotions') }}" icon="fas fa-tags" text="Promotions" title="Créer et gérer des promotions" />
                                    <x-sidebar-item href="{{ route('seller.inventory') }}" icon="fas fa-warehouse" text="Inventaire" title="Gérer votre inventaire" />
                                    <x-sidebar-item href="{{ route('seller.reviews') }}" icon="fas fa-star" text="Avis" title="Voir les avis des clients" />
                                </div>
                            @endhasrole

                            <!-- Admin Menu -->
                            @hasrole('admin')
                                <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50">
                                    <h4 class="px-4 py-2 text-xs font-bold text-afrixTextGray dark:text-afrixMediumGray uppercase tracking-widest">Administration</h4>
                                    <x-sidebar-item href="{{ route('admin.users') }}" icon="fas fa-users" text="Utilisateurs" title="Gérer les utilisateurs" />
                                    <x-sidebar-item href="{{ route('admin.sectors') }}" icon="fas fa-sitemap" text="Secteurs" title="Gérer les secteurs" />
                                    <x-sidebar-item href="{{ route('admin.reports') }}" icon="fas fa-flag" text="Rapports" title="Voir les rapports" />
                                    <x-sidebar-item href="{{ route('admin.banners') }}" icon="fas fa-image" text="Bannières" title="Gérer les bannières" />
                                    <x-sidebar-item href="{{ route('admin.analytics') }}" icon="fas fa-chart-pie" text="Analytiques" title="Voir les analytiques" />
                                    <x-sidebar-item href="{{ route('admin.taxes') }}" icon="fas fa-calculator" text="Taxes" title="Gérer les taxes" />
                                    <x-sidebar-item href="{{ route('admin.support') }}" icon="fas fa-headset" text="Support" title="Gérer le support client" />
                                </div>
                            @endhasrole

                            <!-- Delivery Agent Menu -->
                            @hasrole('delivery_agent')
                                <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50">
                                    <h4 class="px-4 py-2 text-xs font-bold text-afrixTextGray dark:text-afrixMediumGray uppercase tracking-widest">Agent de Livraison</h4>
                                    <x-sidebar-item href="{{ route('delivery.orders') }}" icon="fas fa-truck" text="Commandes à livrer" title="Voir les commandes à livrer" />
                                    <x-sidebar-item href="{{ route('delivery.schedule') }}" icon="fas fa-calendar" text="Planning" title="Voir votre planning de livraison" />
                                    <x-sidebar-item href="{{ route('delivery.feedback') }}" icon="fas fa-comment" text="Retours" title="Voir les retours des clients" />
                                </div>
                            @endhasrole

                            <!-- Marketplace Menu -->
                            <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50">
                                <h4 class="px-4 py-2 text-xs font-bold text-afrixTextGray dark:text-afrixMediumGray uppercase tracking-widest">Marketplace</h4>
                                <x-sidebar-nested-item 
                                    :groups="$groups" 
                                    icon="fas fa-globe" 
                                    text="Catégories Globales" 
                                    :active-group="$activeGroup" 
                                    :active-sector="$activeSector" 
                                    :active-subcategory="$activeSubcategory" 
                                    data-navigate="groups" 
                                    title="Explorer les catégories globales"
                                />
                                <x-sidebar-item href="{{ route('favorites') }}" icon="fas fa-heart" text="Favoris" title="Voir vos favoris" />
                                <x-sidebar-item href="{{ route('history') }}" icon="fas fa-history" text="Historique" title="Voir l'historique de navigation" />
                                <x-sidebar-item href="{{ route('settings') }}" icon="fas fa-cog" text="Paramètres" title="Gérer vos paramètres" />
                            </div>

                            <!-- Theme and Logout -->
                            <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50">
                                <button id="theme-toggle" class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/30 dark:hover:bg-[#2A2A2A]/70 transition-all duration-300 group sidebar-item shadow-md focus:outline-none focus:ring-2 focus:ring-afrixRed/50" title="Changer le thème de l'interface">
                                    <svg class="w-6 h-6 sidebar-icon text-afrixTextGray dark:text-afrixMediumGray group-hover:text-afrixRed dark:group-hover:text-afrixLightGray transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                                    </svg>
                                    <span class="text-afrixBlack dark:text-afrixLightGray font-semibold tracking-wide">Thème</span>
                                    <span class="tooltip absolute left-1/2 transform -translate-x-1/2 bg-afrixBlack dark:bg-afrixLightGray text-white dark:text-afrixBlack px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">{{ __('Thème') }}</span>
                                </button>
                            </div>

                            <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50">
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit" class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 group sidebar-item shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/50" title="Se déconnecter de votre compte">
                                        <svg class="w-6 h-6 sidebar-icon text-red-600 dark:text-red-400 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                        </svg>
                                        <span class="text-red-600 dark:text-red-400 font-semibold tracking-wide">Se déconnecter</span>
                                        <span class="tooltip absolute left-1/2 transform -translate-x-1/2 bg-afrixBlack dark:bg-afrixLightGray text-white dark:text-afrixBlack px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">{{ __('Se déconnecter') }}</span>
                                    </button>
                                </form>
                            </div>
                        @else
                            <!-- Guest Menu -->
                            <div class="space-y-2">
                                <x-sidebar-item href="#explore" icon="fas fa-search" text="Explorer" title="Explorer la plateforme" />
                                <x-sidebar-item href="#categories" icon="fas fa-list-alt" text="Catégories" title="Voir toutes les catégories" />
                                <x-sidebar-item href="#features" icon="fas fa-star" text="Fonctionnalités" title="Découvrir les fonctionnalités" />
                                <x-sidebar-item href="#testimonials" icon="fas fa-comment-alt" text="Témoignages" title="Lire les témoignages des utilisateurs" />
                                <x-sidebar-item href="#contact" icon="fas fa-envelope" text="Contact" title="Contacter le support" />
                            </div>
                            <div class="pt-4 border-t border-white/20 dark:border-[#3E3E3A]/50 space-y-3">
                                <a href="{{ route('login') }}" class="block w-full px-4 py-3 text-sm font-medium text-center rounded-xl border border-white/20 dark:border-[#3E3E3A]/50 hover:bg-white/30 dark:hover:bg-[#2A2A2A]/70 transition-all duration-300 text-afrixBlack dark:text-afrixLightGray shadow-md group focus:outline-none focus:ring-2 focus:ring-afrixRed/50" title="Se connecter à votre compte">
                                    <span class="inline-flex items-center justify-center w-6 mr-3">
                                        <svg class="w-6 h-6 group-hover:text-afrixRed dark:group-hover:text-afrixLightGray transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v-7a3 3 0 00-3-3H5"/>
                                        </svg>
                                    </span>
                                    <span>{{ __('Se connecter') }}</span>
                                    <span class="tooltip absolute left-1/2 transform -translate-x-1/2 bg-afrixBlack dark:bg-afrixLightGray text-white dark:text-afrixBlack px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">{{ __('Se connecter') }}</span>
                                </a>
                                <a href="{{ route('register') }}" class="block w-full px-4 py-3 text-sm font-medium text-center rounded-xl bg-afrixRed hover:bg-afrixDarkRed text-white transition-all duration-300 shadow-md group focus:outline-none focus:ring-2 focus:ring-white/50" title="Créer un nouveau compte">
                                    <span class="inline-flex items-center justify-center w-6 mr-3">
                                        <svg class="w-6 h-6 group-hover:text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                        </svg>
                                    </span>
                                    <span>{{ __('S\'inscrire') }}</span>
                                    <span class="tooltip absolute left-1/2 transform -translate-x-1/2 bg-afrixBlack dark:bg-afrixLightGray text-white dark:text-afrixBlack px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">{{ __('S\'inscrire') }}</span>
                                </a>
                            </div>
                        @endauth
                    </div>
                </div>

                <!-- Groups Level -->
                <div data-level="groups" class="w-full hidden" data-parent-name="Groupes">
                    @hasrole('admin')
                        <div class="px-4 py-3 bg-gradient-to-r from-afrixRed/90 to-afrixDarkRed/90 rounded-xl shadow-lg mb-4">
                            <div class="flex items-center justify-between gap-2">
                                <h3 class="text-sm font-bold text-afrixTextGray dark:text-afrixMediumGray">Gestion des Groupes</h3>
                                <div class="flex items-center gap-2 rounded-xl bg-afrixLightGray/30 dark:bg-afrixBrown/30 shadow-md">
                                    <a href="{{ route('groups.store') }}" class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50" title="Ajouter un nouveau groupe">
                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </a>
                                    <a href="{{ route('groups.index') }}" class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50" title="Gérer les groupes">
                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    @endhasrole
                    <div class="flex items-center justify-between px-4 py-3">
                        <h4 class="text-sm font-bold text-afrixTextGray dark:text-afrixMediumGray">Groupes</h4>
                        <div class="flex items-center gap-0 overflow-hidden rounded-xl bg-afrixLightGray/30 dark:bg-afrixBrown/30 shadow-md">
                            <button data-back class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] transition-colors duration-300 border-r border-white/10 dark:border-afrixBlack" title="Retour au niveau précédent">
                                <svg class="w-6 h-6 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <button data-back-to-main class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] transition-colors duration-300" title="Retour au menu principal">
                                <svg class="w-6 h-6 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    @foreach ($groups as $group)
                        <div class="relative">
                            <div class="flex items-center justify-between px-2 py-1 rounded-xl {{ $activeGroup && $activeGroup->id === $group['id'] ? 'bg-afrixRed/20 dark:bg-afrixRed/30' : '' }}">
                                <x-sidebar-nested-item
                                                                :groups="$groups" 
                                    :icon="null" 
                                    :text="$group['name']" 
                                    :logo="$group['logo_path'] ?? $group['logo_string']" 
                                    :active-group="$activeGroup" 
                                    :active-sector="$activeSector" 
                                    :active-subcategory="$activeSubcategory" 
                                    data-navigate="sectors-{{ $group['id'] }}" 
                                   

                                    :groups="$groups" 
                                    :text="$group['name']"
                                    :logo="$group['logo_path'] ?? $group['logo_string'] ?? null"
                                    
                                    :active="$activeGroup && $activeGroup->id === $group['id']"
                                    :hasChildren="true"
                                    data-navigate="sectors-{{ $group['id'] }}"
                                    title="Explorer les secteurs de {{ $group['name'] }}"
                                    class="flex-grow sidebar-item"
                                />
                                <button class="group-dropdown-toggle p-2 rounded-xl hover:bg-afrixRed/20 dark:hover:bg-afrixGray/20 transition-colors duration-300" data-group-id="{{ $group['id'] }}" aria-expanded="false" aria-controls="group-dropdown-{{ $group['id'] }}" title="Ouvrir les options du groupe {{ $group['name'] }}">
                                    <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray hover:text-afrixRed dark:hover:text-afrixRed transition-transform duration-300" fill="currentColor" viewBox="0 0 297 297" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M279.368,24.726H102.992c-9.722,0-17.632,7.91-17.632,17.632V67.92c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632V42.358C297,32.636,289.09,24.726,279.368,24.726z"/>
                                        <path d="M279.368,118.087H102.992c-9.722,0-17.632,7.91-17.632,17.632v25.562c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632v-25.562C297,125.997,289.09,118.087,279.368,118.087z"/>
                                        <path d="M279.368,211.448H102.992c-9.722,0-17.632,7.91-17.632,17.633v25.561c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632v-25.561C297,219.358,289.09,211.448,279.368,211.448z"/>
                                        <path d="M45.965,24.726H17.632C7.91,24.726,0,32.636,0,42.358V67.92c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632V42.358C63.597,32.636,55.687,24.726,45.965,24.726z"/>
                                        <path d="M45.965,118.087H17.632C7.91,118.087,0,125.997,0,135.719v25.562c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632v-25.562C63.597,125.997,55.687,118.087,45.965,118.087z"/>
                                        <path d="M45.965,211.448H17.632C7.91,211.448,0,219.358,0,229.081v25.561c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632v-25.561C63.597,219.358,55.687,211.448,45.965,211.448z"/>
                                    </svg>
                                </button>
                            </div>
                            <div id="group-dropdown-{{ $group['id'] }}" class="dropdown-content hidden overflow-hidden max-h-0 transition-all duration-500 ease-in-out">
                                <div class="pl-8 pr-4 py-2 bg-white/10 dark:bg-[#1A1A1A]/50 rounded-xl shadow-md">
                                    <a href="{{ route('groups.show', $group['slug']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Voir les détails du groupe {{ $group['name'] }}">
                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                        Voir le groupe
                                    </a>
                                    <a href="{{ route('shops.index', ['group' => $group['slug']]) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Voir les boutiques liées au groupe {{ $group['name'] }}">
                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                                        </svg>
                                        Voir les boutiques
                                    </a>
                                    <a href="{{ route('shops.products.index', ['shop' => $group['slug']]) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Voir les produits du groupe {{ $group['name'] }}">
                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                        </svg>
                                        Voir les produits
                                    </a>
                                    @auth
                                        @hasrole('admin')
                                            <a href="{{ route('groups.update', $group['id']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Modifier le groupe {{ $group['name'] }}">
                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                </svg>
                                                Modifier
                                            </a>
                                            <form action="{{ route('groups.destroy', $group['id']) }}" method="POST" class="block">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Supprimer le groupe {{ $group['name'] }}">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M3 7h18"/>
                                                    </svg>
                                                    Supprimer
                                                </button>
                                            </form>
                                        @endhasrole
                                    @endauth
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>

                <!-- Sectors Level -->
                @foreach ($groups as $group)
                    <div data-level="sectors-{{ $group['id'] }}" class="w-full hidden" data-parent-name="{{ $group['name'] }}">
                        @hasrole('admin')
                            <div class="px-4 py-3 bg-gradient-to-r from-afrixRed/90 to-afrixDarkRed/90 rounded-xl shadow-lg mb-4">
                                <div class="flex items-center justify-between gap-2 ">
                                    <h3 class="text-sm font-bold text-afrixTextGray dark:text-afrixMediumGray">Gestion des Secteurs</h3>
                                    <div class="flex items-center gap-2 overflow-hidden rounded-xl bg-afrixLightGray/30 dark:bg-afrixBrown/30 shadow-md">
                                        <a href="{{ route('sectors.store', ['group' => $group['id']]) }}" class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50" title="Ajouter un nouveau secteur">
                                            <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                            </svg>
                                        </a>
                                        <a href="{{ route('sectors.index', ['group' => $group['id']]) }}" class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50" title="Gérer les secteurs">
                                            <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        @endhasrole
                        <div class="flex items-center justify-between px-4 py-3">
                            <h4 class="text-sm font-bold text-afrixTextGray dark:text-afrixMediumGray">{{ $group['name'] }}</h4>
                            <div class="flex items-center gap-0 overflow-hidden rounded-xl bg-afrixLightGray/30 dark:bg-afrixBrown/30 shadow-md">
                                <button data-back class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] transition-colors duration-300 border-r border-white/10 dark:border-afrixBlack" title="Retour au niveau des groupes">
                                    <svg class="w-6 h-6 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                    </svg>
                                </button>
                                <button data-back-to-main class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] transition-colors duration-300" title="Retour au menu principal">
                                    <svg class="w-6 h-6 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                       @foreach ($group['sectors'] as $sector)
                            <div class="relative">
                                <div class="flex items-center justify-between px-2 py-1 rounded-xl {{ $activeSector == $sector['id'] ? 'bg-afrixRed/20 dark:bg-afrixRed/30' : '' }}">
                                    <x-sidebar-nested-item 
                                        :groups="$groups" 
                                        :icon="null" 
                                        :text="$sector['name']" 
                                        :logo="$sector['logo_path'] ?? $sector['logo_string']" 
                                        :active-group="$activeGroup" 
                                        :active-sector="$activeSector" 
                                        :active-subcategory="$activeSubcategory" 
                                        data-navigate="subcategories-{{ $sector['id'] }}" 
                                        title="Explorer les sous-catégories de {{ $sector['name'] }}"
                                    />
                                    <button class="sector-dropdown-toggle p-2 rounded-xl hover:bg-afrixRed/20 dark:hover:bg-afrixGray/20 transition-colors duration-300" data-sector-id="{{ $sector['id'] }}" aria-expanded="false" aria-controls="sector-dropdown-{{ $sector['id'] }}" title="Ouvrir les options du secteur {{ $sector['name'] }}">
                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray hover:text-afrixRed dark:hover:text-afrixRed transition-transform duration-300" fill="currentColor" viewBox="0 0 297 297" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M279.368,24.726H102.992c-9.722,0-17.632,7.91-17.632,17.632V67.92c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632V42.358C297,32.636,289.09,24.726,279.368,24.726z"/>
                                            <path d="M279.368,118.087H102.992c-9.722,0-17.632,7.91-17.632,17.632v25.562c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632v-25.562C297,125.997,289.09,118.087,279.368,118.087z"/>
                                            <path d="M279.368,211.448H102.992c-9.722,0-17.632,7.91-17.632,17.633v25.561c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632v-25.561C297,219.358,289.09,211.448,279.368,211.448z"/>
                                            <path d="M45.965,24.726H17.632C7.91,24.726,0,32.636,0,42.358V67.92c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632V42.358C63.597,32.636,55.687,24.726,45.965,24.726z"/>
                                            <path d="M45.965,118.087H17.632C7.91,118.087,0,125.997,0,135.719v25.562c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632v-25.562C63.597,125.997,55.687,118.087,45.965,118.087z"/>
                                            <path d="M45.965,211.448H17.632C7.91,211.448,0,219.358,0,229.081v25.561c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632v-25.561C63.597,219.358,55.687,211.448,45.965,211.448z"/>
                                        </svg>
                                    </button>
                                </div>
                                <!-- Liste déroulante pour les secteurs -->
                                <div id="sector-dropdown-{{ $sector['id'] }}" class="dropdown-content hidden overflow-hidden max-h-0 transition-all duration-500 ease-in-out">
                                    <div class="pl-8 pr-4 py-2 bg-white/10 dark:bg-[#1A1A1A]/50 rounded-xl shadow-md">
                                        <a href="{{ route('sectors.show', $sector['slug']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" title="Voir les détails du secteur {{ $sector['name'] }}">
                                            <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>
                                            Voir le secteur
                                        </a>
                                        <a href="{{ route('shops.index', ['sector' => $sector['slug']]) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" title="Voir les boutiques qui opèrent dans le secteur {{ $sector['name'] }}">
                                            <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                                            </svg>
                                            Voir les boutiques
                                        </a>
                                        @if (!empty($sector['shops']))
                                            <div class="relative">
                                                <button class="shop-dropdown-toggle flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" data-sector-id="{{ $sector['id'] }}" aria-expanded="false" aria-controls="shop-dropdown-{{ $sector['id'] }}" title="Voir la liste des boutiques dans {{ $sector['name'] }}">
                                                    <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                                    </svg>
                                                    Boutiques
                                                    <i class="fas fa-chevron-down ml-2 text-afrixTextGray dark:text-afrixLightGray hover:text-afrixRed dark:hover:text-afrixRed transition-transform duration-300"></i>
                                                </button>
                                                <div id="shop-dropdown-{{ $sector['id'] }}" class="shop-dropdown-content hidden overflow-hidden max-h-0 transition-all duration-500 ease-in-out">
                                                    @foreach ($sector['shops'] as $shop)
                                                        <a href="{{ route('shops.show', $shop['slug']) }}" class="flex items-center gap-2 pl-8 pr-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" title="Visiter la boutique {{ $shop['name'] }}">
                                                            @if ($shop['logo_path'])
                                                                <span class="w-5 h-5">{!! $shop['logo_path'] !!}</span>
                                                            @elseif ($shop['logo_string'])
                                                                <img src="{{ asset($shop['logo_string']) }}" alt="{{ $shop['name'] }} Logo" class="w-5 h-5 object-contain">
                                                            @else
                                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                                                </svg>
                                                            @endif
                                                            {{ $shop['name'] }}
                                                        </a>
                                                    @endforeach
                                                </div>
                                            </div>
                                        @endif
                                        <a href="{{ route('sectors.products', $sector['slug']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" title="Voir les produits du secteur {{ $sector['name'] }}">
                                            <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                            </svg>
                                            Voir les produits
                                        </a>
                                        @auth
                                            @hasrole('admin')
                                                <a href="{{ route('sectors.update', $sector['id']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" title="Modifier le secteur {{ $sector['name'] }}">
                                                    <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                    </svg>
                                                    Modifier
                                                </a>
                                                <form action="{{ route('sectors.destroy', $sector['id']) }}" method="POST" class="block">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg" title="Supprimer le secteur {{ $sector['name'] }}">
                                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M3 7h18"/>
                                                        </svg>
                                                        Supprimer
                                                    </button>
                                                </form>
                                            @endhasrole
                                        @endauth
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endforeach

                <!-- Subcategories Level -->
                @foreach ($groups as $group)
                    @foreach ($group['sectors'] as $sector)
                        <div data-level="subcategories-{{ $sector['id'] }}" class="w-full hidden" data-parent-name="{{ $sector['name'] }}">
                            @hasrole('admin')
                                <div class="px-4 py-3 bg-gradient-to-r from-afrixRed/90 to-afrixDarkRed/90 rounded-xl shadow-lg mb-4">
                                    <div class="flex items-center justify-between gap-2">
                                        <h3 class="text-sm font-bold text-afrixTextGray dark:text-afrixMediumGray">Gestion des Sous-catégories</h3>
                                        <div class="flex items-center gap-2 rounded-xl bg-afrixLightGray/30 dark:bg-afrixBrown/30 shadow-md">
                                            <a href="{{ route('subcategories.store', ['sector' => $sector['id']]) }}" class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 sidebar-item" title="Ajouter une nouvelle sous-catégorie">
                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                                </svg>
                                            </a>
                                            <a href="{{ route('subcategories.index', ['sector' => $sector['id']]) }}" class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 sidebar-item" title="Gérer les sous-catégories">
                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            @endhasrole
                            <div class="flex items-center justify-between px-4 py-3">
                                <h4 class="text-sm font-bold text-afrixTextGray dark:text-afrixMediumGray">{{ $sector['name'] }}</h4>
                                <div class="flex items-center gap-0 overflow-hidden rounded-xl bg-afrixLightGray/30 dark:bg-afrixBrown/30 shadow-md">
                                    <button data-back class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] transition-colors duration-300 border-r border-white/10 dark:border-afrixBlack" title="Retour au niveau des secteurs">
                                        <svg class="w-6 h-6 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                        </svg>
                                    </button>
                                    <button data-back-to-main class="p-2 hover:bg-afrixLightGray dark:hover:bg-[#2A2A2A] transition-colors duration-300" title="Retour au menu principal">
                                        <svg class="w-6 h-6 text-afrixTextGray dark:text-afrixMediumGray hover:text-afrixRed dark:hover:text-afrixLightGray transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            @foreach ($sector['subcategories'] as $subcategory)
                                <div class="relative">
                                    <div class="flex items-center justify-between px-2 py-1 rounded-xl {{ $activeSubcategory == $subcategory['id'] ? 'bg-afrixRed/20 dark:bg-afrixRed/30' : '' }}">
                                        <x-sidebar-item 
                                            href="{{ route('category.show', $subcategory['full_slug']) }}" 
                                            :icon="null" 
                                            :text="$subcategory['name']" 
                                            :logo="$subcategory['logo_path'] ?? $subcategory['logo_string']" 
                                            title="Explorer la catégorie {{ $subcategory['name'] }}"
                                            class="flex-grow sidebar-item"
                                        />
                                        <button class="subcategory-dropdown-toggle p-2 rounded-xl hover:bg-afrixRed/20 dark:hover:bg-afrixGray/20 transition-colors duration-300" data-subcategory-id="{{ $subcategory['id'] }}" aria-expanded="false" aria-controls="subcategory-dropdown-{{ $subcategory['id'] }}" title="Ouvrir les options de la catégorie {{ $subcategory['name'] }}">
                                            <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray hover:text-afrixRed dark:hover:text-afrixRed transition-transform duration-300" fill="currentColor" viewBox="0 0 297 297" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M279.368,24.726H102.992c-9.722,0-17.632,7.91-17.632,17.632V67.92c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632V42.358C297,32.636,289.09,24.726,279.368,24.726z"/>
                                                <path d="M279.368,118.087H102.992c-9.722,0-17.632,7.91-17.632,17.632v25.562c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632v-25.562C297,125.997,289.09,118.087,279.368,118.087z"/>
                                                <path d="M279.368,211.448H102.992c-9.722,0-17.632,7.91-17.632,17.633v25.561c0,9.722,7.91,17.632,17.632,17.632h176.376 c9.722,0,17.632-7.91,17.632-17.632v-25.561C297,219.358,289.09,211.448,279.368,211.448z"/>
                                                <path d="M45.965,24.726H17.632C7.91,24.726,0,32.636,0,42.358V67.92c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632V42.358C63.597,32.636,55.687,24.726,45.965,24.726z"/>
                                                <path d="M45.965,118.087H17.632C7.91,118.087,0,125.997,0,135.719v25.562c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632v-25.562C63.597,125.997,55.687,118.087,45.965,118.087z"/>
                                                <path d="M45.965,211.448H17.632C7.91,211.448,0,219.358,0,229.081v25.561c0,9.722,7.91,17.632,17.632,17.632h28.333 c9.722,0,17.632-7.91,17.632-17.632v-25.561C63.597,219.358,55.687,211.448,45.965,211.448z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div id="subcategory-dropdown-{{ $subcategory['id'] }}" class="dropdown-content hidden overflow-hidden max-h-0 transition-all duration-500 ease-in-out">
                                        <div class="pl-8 pr-4 py-2 bg-white/10 dark:bg-[#1A1A1A]/50 rounded-xl shadow-md">
                                            <a href="{{ route('category.show', $subcategory['full_slug']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Voir les détails de la catégorie {{ $subcategory['name'] }}">
                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                </svg>
                                                Voir la catégorie
                                            </a>
                                            <a href="{{ route('shops.index', ['subcategory' => $subcategory['slug']]) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Voir les boutiques qui opèrent dans la catégorie {{ $subcategory['name'] }}">
                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                                                </svg>
                                                Voir les boutiques
                                            </a>
                                            <a href="{{ route('subcategories.show', $subcategory['full_slug']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Voir les produits de la catégorie {{ $subcategory['name'] }}">
                                                <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                                </svg>
                                                Voir les produits
                                            </a>
                                            @auth
                                                @hasrole('admin')
                                                    <a href="{{ route('subcategories.update', $subcategory['id']) }}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Modifier la catégorie {{ $subcategory['name'] }}">
                                                        <svg class="w-5 h-5 text-afrixTextGray dark:text-afrixLightGray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                        </svg>
                                                        Modifier
                                                    </a>
                                                    <form action="{{ route('subcategories.destroy', $subcategory['id']) }}" method="POST" class="block">
                                                        @csrf
                                                        @method('DELETE')
                                                        <button type="submit" class="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-afrixRed/10 dark:hover:bg-afrixRed/20 transition-colors duration-300 rounded-lg sidebar-item" title="Supprimer la catégorie {{ $subcategory['name'] }}">
                                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M3 7h18"/>
                                                            </svg>
                                                            Supprimer
                                                        </button>
                                                    </form>
                                                @endhasrole
                                            @endauth
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @endforeach
                @endforeach
            </div>
        </div>
    </div>
</aside>