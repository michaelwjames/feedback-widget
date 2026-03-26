/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Mock fetch
const mockFetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sources: [] }),
    })
);
global.fetch = mockFetch;
window.fetch = mockFetch;

// Mock html2canvas
global.html2canvas = jest.fn(() => Promise.resolve(document.createElement('canvas')));

describe('Feedback Widget', () => {
    let widgetScript;

    beforeAll(() => {
        // Load the script content
        widgetScript = fs.readFileSync(path.join(__dirname, '..', 'feedback-widget.js'), 'utf8');
    });

    beforeEach(() => {
        // Clear the body
        document.body.innerHTML = '';
        // Mock global FEEDBACK_WIDGET_CONFIG if needed
        window.FEEDBACK_WIDGET_CONFIG = { endpoint: 'http://localhost:12345/api/feedback' };

        // Execute the script
        const script = document.createElement('script');
        script.textContent = widgetScript;
        document.body.appendChild(script);
    });

    it('should inject a feedback button', () => {
        const triggerBtn = document.getElementById('fw-trigger-btn');
        expect(triggerBtn).not.toBeNull();
        expect(triggerBtn.innerText).toBe('Feedback');
    });

    it('should inject an overlay and a modal', () => {
        const overlay = document.getElementById('fw-overlay');
        const modalContainer = document.getElementById('fw-modal-container');
        expect(overlay).not.toBeNull();
        expect(modalContainer).not.toBeNull();
    });

    it('should show the toolbar when the button is clicked', () => {
        const triggerBtn = document.getElementById('fw-trigger-btn');
        const toolbar = document.getElementById('fw-toolbar');

        expect(toolbar.style.display).toBe('none'); // Default state

        triggerBtn.click();
        expect(toolbar.style.display).toBe('flex');
    });

    it('should have a textarea for input', () => {
        const textArea = document.getElementById('fw-feedback-text');
        expect(textArea).not.toBeNull();
        expect(textArea.placeholder).toContain('Explain the issue');
    });

    it('should contain a "Analyze Feedback" button in the modal', () => {
        const submitBtn = document.querySelector('.fw-btn-submit');
        expect(submitBtn).not.toBeNull();
        expect(submitBtn.textContent).toEqual('Analyze Feedback');
    });
});
