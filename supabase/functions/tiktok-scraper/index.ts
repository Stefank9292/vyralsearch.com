import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { username, numberOfVideos = 5, selectedDate, location } = await req.json()
    const apifyKey = Deno.env.get('TIKTOK_APIFY_API_KEY')

    if (!apifyKey) {
      console.error('TIKTOK_APIFY_API_KEY is not set')
      throw new Error('API key not configured')
    }

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Starting TikTok scrape for user: ${username}`)
    console.log(`Number of videos requested: ${numberOfVideos}`)
    console.log(`Selected date filter: ${selectedDate}`)
    console.log(`Selected location: ${location}`)

    // Map the date range values
    let dateRange = "LAST_SIX_MONTHS"; // default value
    if (selectedDate === "THIS_WEEK") {
      dateRange = "THIS_WEEK";
    } else if (selectedDate === "THIS_MONTH") {
      dateRange = "THIS_MONTH";
    }

    // Prepare the request payload
    const payload = {
      customMapFunction: "(object) => { return {...object} }",
      dateRange: dateRange,
      location: location || "US", // Default to US if not specified
      maxItems: numberOfVideos,
      startUrls: [
        username.startsWith('https://') ? username : `https://www.tiktok.com/@${username}`
      ]
    }

    console.log('Sending payload to Apify:', payload)

    // Make the request to Apify API
    const response = await fetch(
      'https://api.apify.com/v2/acts/apidojo~tiktok-scraper/run-sync-get-dataset-items?token=' + apifyKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    )

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.statusText}`)
    }

    const posts = await response.json()
    console.log(`Retrieved ${posts.length} posts`)

    // Process and transform the results
    const processedResults = posts.map(post => ({
      authorUsername: post.authorMeta?.name || username,
      description: post.text || '',
      createTime: new Date(post.createTime).toLocaleDateString(),
      playCount: post.playCount || 0,
      viewCount: post.playCount || 0, // TikTok uses playCount as views
      likeCount: post.diggCount || 0,
      commentCount: post.commentCount || 0,
      engagement: ((post.diggCount + post.commentCount) / (post.playCount || 1) * 100).toFixed(2),
      webVideoUrl: post.webVideoUrl || '',
      timestamp: post.createTime,
    }))

    console.log(`Returning ${processedResults.length} processed results`)

    return new Response(
      JSON.stringify({
        status: 'success',
        data: processedResults,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in TikTok scraper:', error)
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})