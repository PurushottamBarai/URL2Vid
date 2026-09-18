# Free Cloudflare Worker Relay Setup (Optional, 100% Free)

This optional relay lets your Render backend route video extraction through Cloudflare's global edge network (millions of unblocked IPs), bypassing datacenter bot checks completely.

### 60-Second Setup:

1. Log into your free [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Click **Compute (Workers & Pages)** → **Create application** → **Create Worker**.
3. Name it `url2vid-relay` and click **Deploy**.
4. Click **Edit code**, select all text, and paste the code from [`worker.js`](./worker.js).
5. Click **Deploy**.
6. Copy your Worker URL (e.g., `https://url2vid-relay.<your-subdomain>.workers.dev`).
7. In your **Render Dashboard**:
   - Go to your backend service → **Environment**.
   - Add environment variable:
     - **Key:** `CF_YOUTUBE_RELAY_URL`
     - **Value:** `https://url2vid-relay.<your-subdomain>.workers.dev`
   - Save changes.

Your server will now automatically route through Cloudflare Edge with 100,000 free requests per day.
