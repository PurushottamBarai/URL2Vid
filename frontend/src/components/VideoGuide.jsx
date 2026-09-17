import React, { useState } from "react";

const transcript = [
  { time: "0:00", text: "URL2Vid is a versatile online tool that allows you to download videos from any social media platform. It extracts audio/video files directly from URLs, quickly and efficiently. Visit url2vid.codedeck.me" },
  { time: "0:16", text: "Input the URL of the video you want to download from a supported social media site." },
  { time: "0:22", text: "Choose the desired format of the file to download, then click extract, wait for moments." },
  { time: "0:28", text: "Once extraction completes, the video title and details become available for review." },
  { time: "0:34", text: "Choose the available video quality option to determine the download file size and resolution." },
  { time: "0:40", text: "Click download to download the file." },
  { time: "0:43", text: "Once the download is complete, the file will be available to use locally." },
  { time: "0:48", text: "Click here to explore the supported platforms." },
  { time: "0:52", text: "This free tool supports various platforms and ensures legal, personal, and educational use." },
  { time: "0:57", text: "Thank you!" },
];

export default function VideoGuide() {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <section id="video-guide" className="w-full max-w-3xl mx-auto my-12 px-4">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-text-primary text-center sm:text-left">
        How to Download Videos with URL2Vid | Step-by-Step Guide
      </h2>

      <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-surface border border-border aspect-video">
        <iframe
          loading="lazy"
          src="https://www.youtube.com/embed/ONIXO2fe948"
          title="How to Download Videos with URL2Vid | Step-by-Step Guide"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-xl"
        />
      </div>

      <button
        onClick={() => setShowTranscript(!showTranscript)}
        className="mt-4 text-sm font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer flex items-center gap-1.5"
        aria-expanded={showTranscript}
      >
        {showTranscript ? "Hide transcript" : "Show video transcript"}
      </button>

      {showTranscript && (
        <div className="mt-3 space-y-2 text-sm text-text-secondary border-l-2 border-border pl-4 py-1">
          {transcript.map((line, i) => (
            <p key={i} className="leading-relaxed">
              <span className="font-mono text-text-secondary/70 mr-2 font-medium">{line.time}</span>
              {line.text}
            </p>
          ))}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: "How to Download Videos with URL2Vid | Step-by-Step Guide",
            description:
              "Step-by-step guide showing how to use URL2Vid to download videos and audio from any social media platform.",
            thumbnailUrl:
              "https://img.youtube.com/vi/ONIXO2fe948/maxresdefault.jpg",
            uploadDate: "2026-09-17",
            embedUrl: "https://www.youtube.com/embed/ONIXO2fe948",
          }),
        }}
      />
    </section>
  );
}
