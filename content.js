const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';

function getProblemDetails() {
    // Leetcode DOM changes frequently, so this is a best-effort extraction
    const titleElement = document.querySelector('div.flex.items-start.justify-between.gap-4 hdiv') || document.querySelector('h1') || document.querySelector('.text-title-large a') || document.querySelector('[data-cy="question-title"]');
    const descriptionElement = document.querySelector('[data-track-load="description_content"]') || document.querySelector('.elfjS');

    const title = titleElement ? titleElement.innerText : 'Unknown Problem';
    const description = descriptionElement ? descriptionElement.innerText : '';

    return { title, description };
}

async function fetchHint(title, description) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
        return "Please set your Gemini API key in content.js.";
    }

    const prompt = `I am trying to solve a LeetCode problem.
Title: ${title}
Description:
${description}

Provide a helpful hint to guide me in the right direction WITHOUT revealing the solution or writing any code. Keep it brief and conceptual.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error fetching hint:", error);
        return "Sorry, there was an error fetching the hint. Check the console for more details.";
    }
}

function injectButton() {
    // Determine where to inject the button. It should ideally be inside the problem description panel.
    const targetContainer = document.querySelector('.elfjS') || document.querySelector('[data-track-load="description_content"]');
    
    if (!targetContainer) {
        // Retry later if not loaded yet
        setTimeout(injectButton, 1000);
        return;
    }

    if (document.querySelector('.lha-hint-btn')) {
        return; // Already injected
    }

    const button = document.createElement('button');
    button.className = 'lha-hint-btn';
    button.innerText = '💡 Get Hint';
    
    const hintContainer = document.createElement('div');
    hintContainer.className = 'lha-hint-container';
    hintContainer.style.width = '100%';

    button.addEventListener('click', async () => {
        let box = document.querySelector('.lha-hint-box');
        if (!box) {
            box = document.createElement('div');
            box.className = 'lha-hint-box';
            box.innerText = 'Thinking...';
            hintContainer.appendChild(box);
        } else {
            box.innerText = 'Thinking...';
        }

        const { title, description } = getProblemDetails();
        const hint = await fetchHint(title, description);
        box.innerText = hint;
    });

    targetContainer.insertBefore(hintContainer, targetContainer.firstChild);
    hintContainer.appendChild(button);
}

// Wait a bit for the page to load, then try to inject
// LeetCode uses a SPA, so we need to observe DOM changes to handle navigation between problems
setTimeout(injectButton, 2000);

// Basic observer to re-inject button if we navigate to another problem in the SPA
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(injectButton, 2000);
  }
}).observe(document, {subtree: true, childList: true});
