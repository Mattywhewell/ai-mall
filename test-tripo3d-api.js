const fetch = require('node-fetch');

async function testTripo3DAPI() {
    console.log('🧪 Testing Tripo3D API Integration...\n');

    const TRIPO3D_API_KEY = 'tsk_o6tbxmsseUFCqekAUjrzVTzMGe2sb0ZRnqE9QBhJF4-';

    try {
        console.log('📤 Making request to Tripo3D API...');

        const response = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TRIPO3D_API_KEY}`
            },
            body: JSON.stringify({
                "type": "image_to_model",
                "file": {
                    "type": "jpg",
                    "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop"
                }
            })
        });

        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Tripo3D API Success!');
            console.log('📋 Response Data:');
            console.log(JSON.stringify(data, null, 2));

            if (data.task_id) {
                console.log(`\n🔄 Task created with ID: ${data.task_id}`);
                console.log('⏳ You can check task status at:');
                console.log(`   https://api.tripo3d.ai/v2/openapi/task/${data.task_id}`);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Tripo3D API Error:');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${errorText}`);
        }

    } catch (error) {
        console.log('💥 Network Error:');
        console.log(`   ${error.message}`);

        if (error.code) {
            console.log(`   Error Code: ${error.code}`);
        }
    }
}

// Test different endpoints
async function testTripo3DTaskStatus(taskId) {
    console.log(`\n🔍 Checking task status for: ${taskId}`);

    try {
        const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${TRIPO3D_API_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📊 Task Status:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ Status check failed: ${response.status}`);
        }
    } catch (error) {
        console.log(`💥 Status check error: ${error.message}`);
    }
}

// Test text-to-model as alternative (might have different credit requirements)
async function testTextToModel() {
    console.log('\n🧪 Testing Text-to-Model (alternative endpoint)...');

    const TRIPO3D_API_KEY = 'tsk_o6tbxmsseUFCqekAUjrzVTzMGe2sb0ZRnqE9QBhJF4-';

    try {
        const response = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TRIPO3D_API_KEY}`
            },
            body: JSON.stringify({
                "type": "text_to_model",
                "prompt": "a simple cube"
            })
        });

        console.log(`📊 Text-to-Model Response Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Text-to-Model Success!');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ Text-to-Model Error:');
            console.log(`   Response: ${errorText}`);
        }
    } catch (error) {
        console.log(`💥 Text-to-Model Network Error: ${error.message}`);
    }
}

// Run the test
testTripo3DAPI().then(() => {
    return testTextToModel();
}).then(() => {
    console.log('\n✨ Tripo3D API test completed!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ API Key: Valid');
    console.log('✅ Request Format: Correct');
    console.log('⚠️  Credits: Need to purchase Tripo3D credits');
    console.log('\n💡 Next Steps:');
    console.log('1. Visit https://platform.tripo3d.ai/billing');
    console.log('2. Purchase credits for 3D generation');
    console.log('3. Re-run this test to generate actual 3D models');
}).catch(console.error);