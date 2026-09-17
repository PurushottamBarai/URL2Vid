export const platformsData = [
  {
    path: '/youtube-video-downloader',
    platformName: 'YouTube',
    h1: 'YouTube Video Downloader: Download YouTube Videos & Shorts Free',
    intro: 'Use our free YouTube video downloader to save your favorite YouTube videos and Shorts directly to your device. Just paste the link, choose your format (MP4 video or MP3 audio), and hit download.',
    description: "Our YouTube downloader seamlessly handles standard watch URLs, youtu.be shorteners, and vertical YouTube Shorts links. It parses the adaptive video and audio streams directly from YouTube's media servers, allowing you to select resolutions up to 1080p Full HD or convert the audio track straight into high-bitrate MP3 format. The extraction engine automatically bypasses client restrictions without requiring third-party browser extensions.",
    steps: [
      { title: 'Copy the YouTube link', desc: 'Open the YouTube video or Short, click the "Share" button beneath the player, and tap "Copy link".' },
      { title: 'Paste into URL2Vid', desc: 'Come back to this page, paste the copied link into the input box above, and click "Extract".' },
      { title: 'Download your video', desc: 'Select your preferred video quality (e.g., 1080p, 720p) or audio format, and download the file.' }
    ],
    faqs: [
      { question: 'Can I download YouTube Shorts?', answer: 'Yes, our tool fully supports downloading YouTube Shorts in high quality.' },
      { question: "What's the maximum video length supported?", answer: 'We support videos of most standard lengths, though extremely long streams (multiple hours) might take longer to process.' },
      { question: 'Can I download age-restricted videos?', answer: 'Currently, we only support downloading publicly available videos that do not require an account login to view.' },
      { question: 'Can I convert YouTube videos to MP3?', answer: 'Yes! Select the "Audio (MP3)" option from the format dropdown before clicking Extract.' }
    ],
    metaTitle: 'YouTube Video Downloader: Download Videos & Shorts Free | URL2Vid',
    metaDescription: 'Free, fast YouTube video downloader. Save YouTube videos and Shorts in HD MP4 or MP3 format directly to your phone or PC without installing any software.'
  },
  {
    path: '/instagram-reel-downloader',
    platformName: 'Instagram',
    h1: 'Instagram Video Downloader: Save IG Reels & Posts',
    intro: 'Download Instagram videos, Reels, and IGTV posts in high quality with our free online tool. No need to log in or install an app—just paste the IG link and save the MP4 instantly.',
    description: "Downloading Instagram Reels and video posts requires resolving short-lived CDN media tokens without triggering Instagram's login walls. URL2Vid queries the public post endpoints to extract the pristine, uncompressed MP4 source file directly from Meta's content delivery servers. The resulting video retains original sound, color grading, and framing with zero added watermarks or compression loss.",
    steps: [
      { title: 'Copy the Instagram link', desc: 'Open the Instagram app, find the Reel or video post, tap the three dots or share icon, and select "Copy link".' },
      { title: 'Paste the link here', desc: 'Return to URL2Vid, paste the Instagram URL into the box at the top of the page, and press "Extract".' },
      { title: 'Save to your device', desc: 'Click the download button to save the MP4 video directly to your camera roll or computer.' }
    ],
    faqs: [
      { question: 'Can I download private Instagram videos?', answer: 'No. Our tool can only access and download public Instagram posts and Reels.' },
      { question: 'Does this work for Instagram Stories?', answer: 'Currently, we specialize in downloading permanent video posts and Reels, not temporary 24-hour Stories.' },
      { question: 'Will the downloaded video have a watermark?', answer: 'No! The video will be downloaded exactly as it appears on Instagram, without any added watermarks.' }
    ],
    metaTitle: 'Instagram Video Downloader: Save Reels & Posts Free | URL2Vid',
    metaDescription: 'Download Instagram Reels, IGTV, and video posts quickly and anonymously. Free Instagram video downloader with no watermarks or app installation required.'
  },
  {
    path: '/facebook-video-downloader',
    platformName: 'Facebook',
    h1: 'Facebook Video Downloader: Save FB Videos & Reels',
    intro: 'Easily download Facebook videos, Watch clips, and FB Reels. Whether it is a viral meme or a tutorial, our tool helps you save Facebook MP4 videos in HD without an account.',
    description: "Facebook videos are distributed across varied URL formats, including fb.watch shortcuts, Watch feeds, and vertical Facebook Reels. URL2Vid follows Facebook's redirection hops and decodes the manifest to offer both HD and SD MP4 streams for download. You can save public group videos, page clips, and user shares directly to your device without connecting a Facebook account.",
    steps: [
      { title: 'Copy the Facebook link', desc: 'On Facebook, click "Share" beneath the video or Reel, then select "Copy Link".' },
      { title: 'Paste the URL', desc: 'Come back to our downloader, paste the Facebook video link in the input field, and click "Extract".' },
      { title: 'Download the video', desc: 'Choose your preferred video quality (e.g., HD or SD) and click download to save the file.' }
    ],
    faqs: [
      { question: 'Can I download private Facebook videos?', answer: 'No, we respect user privacy. Our tool can only fetch videos that are set to "Public" on Facebook.' },
      { question: 'Does this support Facebook Reels?', answer: 'Yes, you can paste the link to any public Facebook Reel and download it just like a regular video.' },
      { question: 'Are there any limits on downloads?', answer: 'No, you can use our Facebook video downloader as many times as you want for free.' }
    ],
    metaTitle: 'Facebook Video Downloader: Save FB Videos & Reels | URL2Vid',
    metaDescription: 'Download Facebook videos and Reels for free. Save HD Facebook MP4 videos to your phone or PC instantly with our fast online downloader.'
  },
  {
    path: '/twitter-video-downloader',
    platformName: 'X (Twitter)',
    h1: 'X/Twitter Video Downloader: Save Tweets with Video',
    intro: 'Download videos and GIFs from X (formerly Twitter) directly to your device. Simply paste the tweet link to extract the MP4 video file in the highest available quality.',
    description: 'X (formerly Twitter) encodes video uploads into multiple bitrate variants and wraps animated GIFs into looping MP4 containers. URL2Vid analyzes both twitter.com and x.com tweet status URLs, filters through the available rendition playlists, and serves the highest available bitrate MP4 file. You get crystal-clear video and crisp audio with no app installation necessary.',
    steps: [
      { title: 'Copy the Tweet link', desc: 'Click the share icon on the tweet containing the video, and select "Copy link to Tweet".' },
      { title: 'Paste it above', desc: 'Paste the copied twitter.com or x.com link into the downloader input box and click "Extract".' },
      { title: 'Save the video', desc: 'Select the video resolution you want and save the MP4 file to your phone or computer.' }
    ],
    faqs: [
      { question: 'Does this work with x.com links?', answer: 'Yes, our tool fully supports both the old twitter.com and the new x.com URLs.' },
      { question: 'Can I download GIFs from Twitter?', answer: 'Yes! Twitter converts GIFs to video files (MP4), so you can download them just like regular videos.' },
      { question: 'Do I need to install an app?', answer: 'No, our downloader is entirely web-based and works in any browser.' }
    ],
    metaTitle: 'Twitter Video Downloader: Save X/Twitter Videos Free | URL2Vid',
    metaDescription: 'Free X (Twitter) video downloader. Save videos and GIFs from tweets quickly and easily in high quality MP4 format.'
  },
  {
    path: '/pinterest-video-downloader',
    platformName: 'Pinterest',
    h1: 'Pinterest Video Downloader: Save Video Pins',
    intro: 'Download video Pins from Pinterest for offline viewing or inspiration. Our free Pinterest video downloader extracts high-quality MP4s instantly, without needing a Pinterest account.',
    description: 'Pinterest video Pins, animated DIY guides, and Idea Pins are streamed using segmented HLS playlists that standard browser downloaders cannot capture. URL2Vid fetches the underlying media manifest and stitches the video fragments into a complete, high-definition MP4 file. This makes saving craft tutorials, recipes, and design inspiration for offline reference fast and seamless.',
    steps: [
      { title: 'Copy the Pin link', desc: 'Open the Pinterest app or website, click the share icon on the video Pin, and choose "Copy link".' },
      { title: 'Paste into URL2Vid', desc: 'Paste the Pin URL into the search box on this page and hit "Extract".' },
      { title: 'Download your Pin', desc: 'Choose your desired video quality from the list and download the MP4 straight to your device.' }
    ],
    faqs: [
      { question: 'Can I download images from Pinterest?', answer: 'Our tool is optimized for video Pins. For images, you can usually just right-click or long-press and save directly from Pinterest.' },
      { question: 'Do I need to log in to Pinterest?', answer: 'No, you do not need a Pinterest account to download public video Pins using our service.' },
      { question: 'Are Idea Pins supported?', answer: 'Yes, as long as the Idea Pin contains video content and is public, our tool can extract it.' }
    ],
    metaTitle: 'Pinterest Video Downloader: Save Video Pins Free | URL2Vid',
    metaDescription: 'Download Pinterest video Pins in high quality for free. Fast, no-login Pinterest video downloader for mobile and desktop.'
  },
  {
    path: '/reddit-video-downloader',
    platformName: 'Reddit',
    h1: 'Reddit Video Downloader: Save Reddit Videos with Sound Free',
    intro: 'Download Reddit videos with audio intact. Our online Reddit video downloader works with comments links, short links, and v.redd.it links, giving you clean MP4 videos with sound.',
    description: 'Reddit serves user uploads via separated DASH video and audio streams under v.redd.it, which causes standard browser downloads to have no audio. URL2Vid automatically resolves all Reddit post links, new mobile share-links (reddit.com/r/.../s/...), and legacy old.reddit URLs. It downloads both the high-definition video track and audio track, merging them on the fly into a synchronized MP4 file with full sound.',
    steps: [
      { title: 'Copy the Reddit post link', desc: 'Click the "Share" button beneath the Reddit post containing the video, and select "Copy link".' },
      { title: 'Paste into URL2Vid', desc: 'Paste the Reddit link into the search box on this page and click "Extract".' },
      { title: 'Download with sound', desc: 'Select your preferred video resolution and download your Reddit video with synced audio.' }
    ],
    faqs: [
      { question: 'Do downloaded Reddit videos have sound?', answer: 'Yes! Our tool automatically merges the video and audio streams so your downloaded MP4 has full sound.' },
      { question: 'Can I download Reddit short links (s/)?', answer: 'Yes, our resolver seamlessly handles both standard reddit.com post URLs and new mobile app share links.' },
      { question: 'Is it free to use?', answer: 'Yes, URL2Vid is completely free with no registration or download caps.' }
    ],
    metaTitle: 'Reddit Video Downloader: Save Reddit Videos with Audio Free | URL2Vid',
    metaDescription: 'Free Reddit video downloader with sound. Download Reddit videos and GIFs with synced audio in high quality MP4 format simply by pasting the post link.'
  },
  {
    path: '/linkedin-video-downloader',
    platformName: 'LinkedIn',
    h1: 'LinkedIn Video Downloader: Save LinkedIn Videos & Posts',
    intro: 'Easily download video posts, talks, keynote clips, and learning snippets from LinkedIn in HD quality. No account or login credentials required—just paste the post link.',
    description: 'LinkedIn video posts, keynote presentations, and corporate tutorials are often shared using shortened lnkd.in redirect links. URL2Vid resolves these redirects, bypasses the professional network sign-in prompt, and extracts the progressive MP4 stream in full resolution. Perfect for saving executive interviews, industry panels, and educational talks directly to your storage for offline study.',
    steps: [
      { title: 'Copy the LinkedIn post link', desc: 'Click the three dots on the top right of the LinkedIn post and choose "Copy link to post".' },
      { title: 'Paste into URL2Vid', desc: 'Paste the LinkedIn URL into the input field above and hit "Extract".' },
      { title: 'Save your video', desc: 'Click the download button to save the MP4 video directly to your computer or phone.' }
    ],
    faqs: [
      { question: 'Does it support short lnkd.in links?', answer: 'Yes, our system automatically resolves shortened lnkd.in links and extracts the original media.' },
      { question: 'Can I download private LinkedIn videos?', answer: 'No, we only support publicly visible LinkedIn video posts.' },
      { question: 'Do I need to sign in with LinkedIn?', answer: 'No, you never need to connect or log in with your LinkedIn account.' }
    ],
    metaTitle: 'LinkedIn Video Downloader: Save LinkedIn Videos Free | URL2Vid',
    metaDescription: 'Free LinkedIn video downloader. Save business presentations, talks, and video posts from LinkedIn as MP4 files quickly and without logging in.'
  },
  {
    path: '/snapchat-video-downloader',
    platformName: 'Snapchat',
    h1: 'Snapchat Spotlight Downloader: Save Public Snapchat Videos',
    intro: 'Download public Snapchat Spotlight videos in crisp MP4 format without watermarks. Fast, secure, and works directly in your web browser on mobile or desktop.',
    description: 'Snapchat Spotlight features short-form vertical videos distributed through temporary secure CDN endpoints. URL2Vid inspects public Spotlight sharing links, parses the original media asset, and delivers a clean MP4 file without any platform logos or overlay stamps. You can easily archive your favorite community highlights directly to your phone\'s camera roll or desktop drive.',
    steps: [
      { title: 'Copy the Spotlight link', desc: 'On Snapchat, tap the share icon on the Spotlight video and select "Copy link".' },
      { title: 'Paste into the downloader', desc: 'Paste the Snapchat link into the box above and click "Extract".' },
      { title: 'Download your video', desc: 'Save the MP4 video straight to your photo gallery or downloads folder.' }
    ],
    faqs: [
      { question: 'Can I download private Snaps or Stories?', answer: 'No, our tool is strictly for publicly shared Snapchat Spotlight videos.' },
      { question: 'Does URL2Vid add a watermark?', answer: 'No, downloaded videos are saved as close to the original source quality as possible without added watermarks.' },
      { question: 'Does this work on mobile?', answer: 'Yes, it works smoothly in Safari, Chrome, and all mobile browsers.' }
    ],
    metaTitle: 'Snapchat Spotlight Downloader: Download Snapchat Videos Free | URL2Vid',
    metaDescription: 'Download public Snapchat Spotlight videos for free in high definition MP4 format. Fast, online, and no account or app required.'
  },
  {
    path: '/threads-video-downloader',
    platformName: 'Threads',
    h1: 'Threads Video Downloader: Save Videos from Meta Threads',
    intro: 'Save videos and clips from Instagram Threads in high-definition MP4. Easily download clips from threads.net and threads.com without logging in or installing third-party apps.',
    description: 'Meta Threads platform hosts videos and short clips across both threads.net and threads.com domain routes. URL2Vid connects directly to the public Threads post metadata to fetch the highest quality progressive MP4 video available. Download humor clips, tech updates, and sports highlights cleanly without logging in or installing secondary apps.',
    steps: [
      { title: 'Copy the Threads link', desc: 'Tap the share or paper plane icon on the Threads post and select "Copy link".' },
      { title: 'Paste above', desc: 'Paste the Threads post URL into our downloader and press "Extract".' },
      { title: 'Download MP4', desc: 'Choose your format and save the video directly to your device.' }
    ],
    faqs: [
      { question: 'Does this support both threads.net and threads.com?', answer: 'Yes, links from both domains are fully supported.' },
      { question: 'Do I need a Threads account?', answer: 'No, you do not need an account or login to download public Threads videos.' },
      { question: 'Are videos saved in HD?', answer: 'Yes, videos are fetched in the highest resolution made available by Threads.' }
    ],
    metaTitle: 'Threads Video Downloader: Save Threads Videos Free | URL2Vid',
    metaDescription: 'Free Threads video downloader. Download videos from Threads by Meta quickly and without watermarks in high quality MP4 format.'
  },
  {
    path: '/vimeo-video-downloader',
    platformName: 'Vimeo',
    h1: 'Vimeo Video Downloader: Download Vimeo Videos in HD',
    intro: 'Download high-definition videos from Vimeo directly to your PC, Mac, iPhone, or Android device. Choose between 1080p, 720p, or extract MP3 audio effortlessly.',
    description: 'Vimeo is renowned for hosting high-bitrate artistic, documentary, and indie film productions. URL2Vid queries Vimeo player config to present all available resolutions—from 360p up to pristine 1080p Full HD—as well as dedicated MP3 audio extraction. Every file is downloaded directly from Vimeo origin servers, ensuring pristine video fidelity and synchronized audio.',
    steps: [
      { title: 'Copy the Vimeo link', desc: 'Copy the Vimeo video URL from your browser address bar or share sheet.' },
      { title: 'Paste into URL2Vid', desc: 'Paste the Vimeo video link into the box above and click "Extract".' },
      { title: 'Save your file', desc: 'Select your preferred resolution or audio format and download instantly.' }
    ],
    faqs: [
      { question: 'Can I download private or password-protected Vimeo videos?', answer: 'No, we only support public Vimeo videos.' },
      { question: 'Can I extract audio only from Vimeo?', answer: 'Yes! Select the "Audio (MP3)" option to extract sound from Vimeo videos.' },
      { question: 'Is there a file size limit?', answer: 'Most standard Vimeo videos download within seconds without arbitrary file size caps.' }
    ],
    metaTitle: 'Vimeo Video Downloader: Download High Quality Vimeo Videos | URL2Vid',
    metaDescription: 'Download Vimeo videos in HD 1080p or 720p MP4 format for free. Simple online Vimeo video downloader with no registration needed.'
  },
  {
    path: '/twitch-clip-downloader',
    platformName: 'Twitch',
    h1: 'Twitch Clip Downloader: Save Twitch Clips in High Quality',
    intro: 'Download memorable gaming highlights and Twitch broadcast clips in full 1080p or 720p MP4. Fast, free, and designed for streamers and fans alike.',
    description: "Twitch clips captured from clips.twitch.tv or stream channel clip URLs are hosted as standalone highlight files on Twitch broadcast servers. URL2Vid extracts the direct video stream, providing standard 1080p or 720p 60fps MP4 files ready for instant saving. Ideal for gaming creators, esports fans, and editors looking to archive viral stream moments and reaction clips.",
    steps: [
      { title: 'Copy the Twitch clip link', desc: 'Click the share button on the Twitch clip and copy the clip link (clips.twitch.tv or twitch.tv/.../clip).' },
      { title: 'Paste into URL2Vid', desc: 'Paste the Twitch clip link into the search bar and click "Extract".' },
      { title: 'Download clip', desc: 'Select your preferred video resolution and save the clip to your device.' }
    ],
    faqs: [
      { question: 'Does this work for clips.twitch.tv links?', answer: 'Yes, both clips.twitch.tv and standard Twitch clip links work seamlessly.' },
      { question: 'Can I download full live streams?', answer: 'This tool is optimized for Twitch clips and highlights rather than multi-hour live VODs.' },
      { question: 'Is this free?', answer: 'Yes, URL2Vid is 100% free with no hidden charges.' }
    ],
    metaTitle: 'Twitch Clip Downloader: Download Twitch Clips Free | URL2Vid',
    metaDescription: 'Free online Twitch clip downloader. Save highlight clips from Twitch streams in high-definition MP4 directly to your PC or mobile.'
  },
  {
    path: '/dailymotion-video-downloader',
    platformName: 'Dailymotion',
    h1: 'Dailymotion Video Downloader: Save Dailymotion Videos Free',
    intro: 'Download public Dailymotion videos, news clips, and shows in crystal-clear MP4 format. Save videos directly to your device without installing software.',
    description: 'Dailymotion streams news reports, music videos, and sports broadcasts using dynamic multi-bitrate HTTP streams. URL2Vid inspects the stream manifest to identify the highest resolution available, compiling the segments into a single, clean MP4 video file. You can download and watch full-length videos offline on any device with no watermark or software installation required.',
    steps: [
      { title: 'Copy the Dailymotion link', desc: 'Open the Dailymotion video and copy its URL from the browser address bar or share icon.' },
      { title: 'Paste into URL2Vid', desc: 'Paste the link into the extraction input above and click "Extract".' },
      { title: 'Download your video', desc: 'Pick your desired quality from the formats list and save the video.' }
    ],
    faqs: [
      { question: 'Does this work on mobile devices?', answer: 'Yes, URL2Vid works on iOS, Android, macOS, and Windows browsers.' },
      { question: 'Does URL2Vid add watermarks?', answer: 'Never. Your downloaded video is clean, exactly as published.' },
      { question: 'Do I need to sign up?', answer: 'No account, login, or registration is required.' }
    ],
    metaTitle: 'Dailymotion Video Downloader: Download Dailymotion Videos | URL2Vid',
    metaDescription: 'Fast, free Dailymotion video downloader. Download Dailymotion videos in MP4 format without registration or added watermarks.'
  }
];
