// Test script to explore API.Bible capabilities
// This will help us understand what's available before integrating

const API_BIBLE_BASE_URL = 'https://api.scripture.api.bible/v1';
const API_KEY = 'YOUR_API_KEY_HERE'; // We'll need to get this from API.Bible

// For testing without API key, we'll use a demo approach
const DEMO_MODE = true;

async function testApiBible() {
  console.log('🔍 Testing API.Bible integration...\n');

  if (DEMO_MODE) {
    console.log('📋 DEMO MODE: Showing what API.Bible can do without API key\n');
    
    // Show what we can expect from API.Bible
    console.log('📖 Available Bible Versions (sample):');
    console.log('- English Standard Version (ESV)');
    console.log('- New International Version (NIV)');
    console.log('- King James Version (KJV)');
    console.log('- New Living Translation (NLT)');
    console.log('- And 2,500+ more versions in 1,600+ languages\n');

    console.log('📝 Verse Retrieval Example:');
    console.log('Reference: John 3:16');
    console.log('Content: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."\n');

    console.log('📚 Reading Plans Available:');
    console.log('- Bible in One Year');
    console.log('- Daily Devotions');
    console.log('- Topical Studies');
    console.log('- Book Studies\n');

    console.log('🔗 API Endpoints We Can Use:');
    console.log('- GET /bibles - List all available Bible versions');
    console.log('- GET /bibles/{bibleId}/books - Get books in a Bible');
    console.log('- GET /bibles/{bibleId}/books/{bookId}/chapters - Get chapters');
    console.log('- GET /bibles/{bibleId}/verses/{verseId} - Get specific verse');
    console.log('- GET /bibles/{bibleId}/search - Search scripture');
    console.log('- GET /reading-plans - Get available reading plans\n');

    console.log('💡 Integration Plan:');
    console.log('1. User selects Bible version (ESV, NIV, etc.)');
    console.log('2. User searches for or selects scripture');
    console.log('3. Verse content auto-populates in SOAP study');
    console.log('4. User completes Observation, Application, Prayer');
    console.log('5. Optional: Link to YouVersion for deeper study\n');

    return;
  }

  try {
    // Test 1: Get available Bible versions
    console.log('📖 Testing: Get Bible versions...');
    const versionsResponse = await fetch(`${API_BIBLE_BASE_URL}/bibles`, {
      headers: {
        'api-key': API_KEY
      }
    });
    
    if (versionsResponse.ok) {
      const versions = await versionsResponse.json();
      console.log('✅ Available Bible versions:', versions.data?.length || 0);
      console.log('Sample versions:', versions.data?.slice(0, 3).map(v => ({
        id: v.id,
        name: v.name,
        language: v.language?.name
      })));
    } else {
      console.log('❌ Failed to get versions:', versionsResponse.status);
    }

    // Test 2: Get a specific verse (John 3:16)
    console.log('\n📝 Testing: Get specific verse...');
    const verseResponse = await fetch(`${API_BIBLE_BASE_URL}/bibles/de4e12af7f28f599-02/verses/JHN.3.16`, {
      headers: {
        'api-key': API_KEY
      }
    });
    
    if (verseResponse.ok) {
      const verse = await verseResponse.json();
      console.log('✅ Retrieved verse:', verse.data?.content);
    } else {
      console.log('❌ Failed to get verse:', verseResponse.status);
    }

    // Test 3: Search for devotions/reading plans
    console.log('\n📚 Testing: Search for reading plans...');
    const plansResponse = await fetch(`${API_BIBLE_BASE_URL}/reading-plans`, {
      headers: {
        'api-key': API_KEY
      }
    });
    
    if (plansResponse.ok) {
      const plans = await plansResponse.json();
      console.log('✅ Available reading plans:', plans.data?.length || 0);
      console.log('Sample plans:', plans.data?.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      })));
    } else {
      console.log('❌ Failed to get reading plans:', plansResponse.status);
    }

  } catch (error) {
    console.error('❌ Error testing API.Bible:', error.message);
  }
}

// Run the test
testApiBible();
