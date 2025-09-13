"use client";

import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [emojiData, setEmojiData] = useState([]);

  const handleOpen = () => {
    router.push('/students');
  };

  const emojis = [
    "🌸", "✨", "💖", "🎀", "💕", "🎉", "💎", "💫", "🌟", "🦋",
    "🌿", "🍃", "🌼", "🌈", "💐", "🌞", "⭐", "💓", "🌷", "🌺",
    "🍀", "☘️", "🌻", "🌹", "🌱", "🪷", "🦄", "🌠", "🎇", "🎆"
  ];

  useEffect(() => {
    const data = Array.from({ length: 30 }).map(() => ({
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      fontSize: 1.5 + Math.random() * 2.5,
      animationDuration: 5 + Math.random() * 5,
      animationDelay: Math.random() * 5
    }));
    setEmojiData(data);
  }, []);

  return (
    <div className="page">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Brush+Script+MT&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Floating emojis */}
      {emojiData.map((e, i) => (
        <div
          key={i}
          className="emoji"
          style={{
            left: `${e.left}%`,
            fontSize: `${e.fontSize}rem`,
            animationDuration: `${e.animationDuration}s`,
            animationDelay: `${e.animationDelay}s`
          }}
        >
          {e.emoji}
        </div>
      ))}

      <div className="welcome-container">
        <h1>🌿💖 Welcome 💖🌿</h1>
        <h2>✨ RMR ❤️ Presents ✨</h2>
        <button onClick={handleOpen}>🚀 Open Portal</button>
      </div>

      <style jsx>{`
        .page {
          height: 100vh;
          width: 100vw;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #a2d9ff, #c3f0ff);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
          overflow: hidden;
          font-family: "Brush Script MT", cursive;
          position: relative;
        }

       .welcome-container {
  background: #ffb6c1; /* Light pink */
  padding: 100px 120px;
  border-radius: 50%; /* circle shape */
  clip-path: polygon(
    50% 0%, 54% 10%, 60% 5%, 65% 15%, 70% 10%, 75% 20%, 80% 15%, 
    85% 25%, 90% 20%, 95% 30%, 100% 25%, 95% 35%, 100% 40%, 95% 45%, 
    100% 50%, 95% 55%, 100% 60%, 95% 65%, 100% 70%, 95% 75%, 90% 70%, 
    85% 80%, 80% 75%, 75% 85%, 70% 80%, 65% 90%, 60% 85%, 54% 95%, 
    50% 90%, 46% 95%, 40% 85%, 35% 90%, 30% 80%, 25% 85%, 20% 75%, 
    15% 80%, 10% 70%, 5% 75%, 0% 70%, 5% 65%, 0% 60%, 5% 55%, 
    0% 50%, 5% 45%, 0% 40%, 5% 35%, 0% 30%, 5% 25%, 10% 20%, 
    15% 25%, 20% 15%, 25% 20%, 30% 10%, 35% 15%, 40% 5%, 46% 10%
  );
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
  animation: floatBox 4s ease-in-out infinite, fadeInUp 1.2s ease;
  color: #222;
  z-index: 2;
}


        h1 {
          font-size: 4rem;
          margin-bottom: 15px;
          font-weight: bold;
          color: #228b22;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 30px;
          color: #444;
        }

        button {
          padding: 16px 45px;
          font-size: 22px;
          border-radius: 50px;
          cursor: pointer;
          background: linear-gradient(45deg, #43e97b, #38f9d7);
          border: none;
          color: white;
          transition: all 0.3s ease;
          font-weight: bold;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.25);
        }

        button:hover {
          transform: scale(1.15);
          box-shadow: 0 8px 35px rgba(0, 0, 0, 0.3);
        }

        .emoji {
          position: absolute;
          top: 100%;
          animation: float linear infinite;
          opacity: 0.85;
          z-index: 1;
        }

        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-60vh) rotate(180deg); }
          100% { top: -20%; transform: translateY(-120vh) rotate(360deg); }
        }

        @keyframes floatBox {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}