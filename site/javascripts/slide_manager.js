/**
 * slide-manager.js
 * Centralized logic for handling slide navigation, email persistence,
 * cache busting, and frame breaking.
 */

// --- 1. GLOBAL FRAME BUSTER ---
// Ensures no page ever gets stuck inside an iframe (like Kobo's redirect)
if (window.self !== window.top) {
    window.top.location.href = window.location.href;
}

document.addEventListener('DOMContentLoaded', () => {
    const config = document.getElementById('slide-config');
    
    // If no config div is found, do nothing
    if (!config) return;

    // --- SMART PATH FIXER ---
    // Fixes the "../" issue on GitHub Pages vs Localhost
    const getResolvedNextUrl = (rawUrl) => {
        if (!rawUrl) return '';
        
        // Only attempt to fix relative paths starting with "../"
        if (!rawUrl.startsWith('../')) return rawUrl;

        // Check if we are at the "Home" directory of the site
        const isDirRoot = window.location.pathname.endsWith('/');
        const pathSegments = window.location.pathname.split('/').filter(p => p && !p.includes('.html'));
        const isGitHub = window.location.hostname.includes('github.io');

        // Logic:
        // GitHub Pages Root is usually /RepoName/ (1 segment)
        // Localhost Root is / (0 segments)
        // If we are at this root depth, "../" is wrong; it should be "./"
        const isHome = (isGitHub && pathSegments.length === 1) || (!isGitHub && pathSegments.length === 0);

        if (isDirRoot && isHome) {
            return rawUrl.replace(/^\.\.\//, './');
        }
        return rawUrl;
    };

    // Extract configuration
    const type = config.dataset.type;
    // Apply the fix to the next URL immediately
    const nextUrl = getResolvedNextUrl(config.dataset.next);
    
    const imgSource = config.dataset.img;
    
    // KOBO SPECIFIC
    const koboId = config.dataset.koboId; 
    const koboWidth = config.dataset.width || '100%'; 
    
    // Container injection
    const container = document.createElement('div');
    container.id = 'dynamic-slide-content';
    config.parentNode.insertBefore(container, config.nextSibling);

    // --- SHARED FUNCTIONS ---

    // 1. Email Management
    const getEmail = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('email')) {
            const email = urlParams.get('email');
            sessionStorage.setItem('participant_email', email);
            return email;
        }
        return sessionStorage.getItem('participant_email') || '';
    };

    const saveEmail = (email) => {
        sessionStorage.setItem('participant_email', email);
    };

    // 2. Navigation
    const goToNext = (url) => {
        if (!url) return;
        
        const currentEmail = getEmail();
        let targetUrl = url;

        // Note: url is already relative-safe thanks to getResolvedNextUrl
        if (currentEmail) {
            const separator = url.includes('?') ? '&' : '?';
            targetUrl = `${url}${separator}email=${encodeURIComponent(currentEmail)}`;
        }

        if (window.top !== window.self) {
            window.top.location.href = targetUrl;
        } else {
            window.location.href = targetUrl;
        }
    };

    // --- TYPE SPECIFIC LOGIC ---

    // TYPE 4: Initial Slide (Ask for Email)
    if (type === 'start') {
        const existingEmail = getEmail();
        
        container.innerHTML = `
            <div class="input-group">
                <input type="email" id="user-email" placeholder="Enter your email" value="${existingEmail}" required />
                <button id="start-btn" class="nav-btn">Start Session</button>
            </div>
        `;

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const emailInput = document.getElementById('user-email').value;
                if (emailInput) {
                    saveEmail(emailInput);
                    goToNext(nextUrl); // Use fixed URL
                } else {
                    alert("Please enter a valid email address.");
                }
            });
        }
    }

    // TYPE 1: Kobo Form
    else if (type === 'kobo') {
        const email = getEmail();
        
        // Build the absolute return URL using the FIXED nextUrl
        const nextAbsoluteUrl = new URL(nextUrl, window.location.href);
        if (email) nextAbsoluteUrl.searchParams.set("email", email);

        let finalKoboUrl = `https://ee.kobotoolbox.org/single/${koboId}?hide=saving&return_url=${encodeURIComponent(nextAbsoluteUrl.href)}`;
        
        if (email) {
            finalKoboUrl += `&d[email]=${encodeURIComponent(email)}`;
        }

        container.innerHTML = `
            <div class="iframe-wrapper">
                <iframe 
                    src="${finalKoboUrl}" 
                    width="${koboWidth}" 
                    height="650px" 
                    frameborder="0" 
                    style="width: ${koboWidth};">
                </iframe>
            </div>
            <div class="nav-wrapper">
                <p><em>Form not loading or redirecting?</em></p>
                <button id="next-btn" class="nav-btn">Manually Go Next</button>
            </div>
        `;

        document.getElementById('next-btn').addEventListener('click', () => goToNext(nextUrl));
    }

    // TYPE 2: Figure + Button
    else if (type === 'figure') {
        const timestamp = new Date().getTime();
        const separator = imgSource.includes('?') ? '&' : '?';
        const freshImgSrc = `${imgSource}${separator}v=${timestamp}`;

        container.innerHTML = `
            <div class="figure-wrapper">
                <img src="${freshImgSrc}" alt="Dynamic Figure" class="slide-figure" />
            </div>
            <div class="nav-wrapper">
                <button id="next-btn" class="nav-btn">Next Slide</button>
            </div>
        `;

        document.getElementById('next-btn').addEventListener('click', () => goToNext(nextUrl));
    }

    // TYPE 3: Simple Content
    else if (type === 'simple') {
        container.innerHTML = `
            <div class="nav-wrapper">
                <button id="next-btn" class="nav-btn">Next Slide</button>
            </div>
        `;

        document.getElementById('next-btn').addEventListener('click', () => goToNext(nextUrl));
    }
});
