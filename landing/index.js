const closeBtn = document.querySelector('.btn-close')
const announcement = document.querySelector('.announcement')
function hideAnnouncement() {
    announcement.style.display = 'none'
}
closeBtn.addEventListener('click', hideAnnouncement)
const texts = [
    {
        title: '“Seer, Who will win the 2024 U.S. Presidential Election?”',
        subtitle: 'According to the Markets, Donald Trump has a 63.5% chance of winning.'
    },
    {
        title: '“Seer, The price of Bitcoin at the start of 2025? [USD]”',
        subtitle: 'Market estimate: 60,000'
    },
    {
        title: '“Seer, How many popular votes will [candidate] receive in the 2024 U.S. Presidential election?”',
        subtitle: '#1 Kamala Harris: 49.6%, #2 Donald Trump: 48.4%'
    }
];

const container = document.getElementById('textContainer');
let currentIndex = 0;

function updateText() {
    // Fade out
    container.style.opacity = 0;

    // After fade out, update content and fade in
    setTimeout(() => {
        const currentText = texts[currentIndex];
        container.innerHTML = `
                <p class="text-2xl text-linear">${currentText.title}</p>
                <p class="text-base text-purple-2">${currentText.subtitle}</p>
            `;

        // Trigger reflow to ensure opacity transition works
        container.offsetHeight;

        container.style.opacity = 1;

        // Cycle to next text
        currentIndex = (currentIndex + 1) % texts.length;
    }, 500); // matches fade out duration
}

// Start initial cycle after first interval
setTimeout(() => {
    setInterval(updateText, 4000); // 4 seconds per text (3s display + 1s transition)
}, 4000);