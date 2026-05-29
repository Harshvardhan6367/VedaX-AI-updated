// node v18+ has built-in fetch

async function testTTS() {
    const text = "Hello, this is a test of the voice generation feature.";
    const languageCode = "en";

    try {
        const res = await fetch('http://localhost:5000/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, languageCode }),
        });

        if (!res.ok) {
            console.error('Error:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Body:', errorText);
            return;
        }

        const data = await res.json();
        if (data.audioContent) {
            console.log('✅ Success! Received audio content (base64 length:', data.audioContent.length, ')');
        } else {
            console.log('❌ Failed: No audio content in response');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testTTS();
