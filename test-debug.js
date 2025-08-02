// Simple test to debug the #text structure issue
const testContent = `<thinking>{"#text":"To analyze the distribution of payment methods"}</thinking>`;

// Test if the regex captures the JSON structure
const regex = /<(thinking)>(.*?)<\/\1>/gs;
const match = regex.exec(testContent);

if (match) {
  console.log("Captured content:", match[2]);

  try {
    const parsed = JSON.parse(match[2]);
    console.log("Parsed JSON:", parsed);

    if (parsed && parsed["#text"]) {
      console.log("Extracted #text:", parsed["#text"]);
    }
  } catch (e) {
    console.log("Failed to parse as JSON:", e.message);
  }
}
