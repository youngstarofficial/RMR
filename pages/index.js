import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  const handleOpen = () => {
    router.push('/students');
  };

  // Emoji set
  const emojis = [
    "🌸", "✨", "💖", "🎀", "💕", "🎉", "💎", "💫", "🌟", "🦋",
    "🌿", "🍃", "🌼", "🌈", "💐", "🌞", "⭐", "💓", "🌷", "🌺",
    "🍀", "☘️", "🌻", "🌹", "🌱", "🪷", "🦄", "🌠", "🎇", "🎆"
  ];

  return (
    <div className="page">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Brush+Script+MT&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Floating emojis */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="emoji"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 5}s`,
            fontSize: `${1.5 + Math.random() * 2.5}rem`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
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
          background: linear-gradient(-45deg, #d4fc79, #96e6a1, #c9f9c2, #b7f8db);
          background-size: 400% 400%;
          animation: gradientBG 10s ease infinite;
          overflow: hidden;
          font-family: "Brush Script MT", cursive;
          position: relative;
        }

        .welcome-container {
          background: rgba(255, 255, 255, 0.9);
          padding: 70px 90px;
          border-radius: 30px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
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

        /* Floating emojis */
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

        /* Floating white box */
        @keyframes floatBox {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
