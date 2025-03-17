import { useEffect, useState } from 'react';

const INSTAGRAM_USER_ID = '1708933690022151';
const INSTAGRAM_ACCESS_TOKEN = 'EAAYSRCGJ2QcBO9QS5UZCynctsIdIZC6sL1NTzK0OsYcow4zeGgmQcWOCpdvL1d2qokXaQjYRZCyhR7933T4kZAhnHypNlfsBcDZCmOTegOD9PYgqkEa6v9Wx5f3wWJkcbMJUwmoQLxmKxAtrwEOX1eXiXB0A026QUD0FfxS0ZAeEJYTsIlFzaJbSkv';
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/https://graph.instagram.com/v19.0/1708933690022151/media?fields=id,media_type,media_url,permalink&access_token=EAAYSRCGJ2QcBO9QS5UZCynctsIdIZC6sL1NTzK0OsYcow4zeGgmQcWOCpdvL1d2qokXaQjYRZCyhR7933T4kZAhnHypNlfsBcDZCmOTegOD9PYgqkEa6v9Wx5f3wWJkcbMJUwmoQLxmKxAtrwEOX1eXiXB0A026QUD0FfxS0ZAeEJYTsIlFzaJbSkv';
const INSTAGRAM_API_URL = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,media_type,media_url,permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

interface InstagramPost {
  id: string;
  media_type: string;
  media_url: string;
  permalink: string;
}

const InstagramFeed: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
  try {
    const response = await fetch(`${PROXY_URL}${INSTAGRAM_API_URL}`);
    const data = await response.json();
    setPosts(data.data || []);
  } catch (err) {
    setError('Error fetching Instagram posts:' + err);
  }
};

    fetchInstagramPosts();
  }, []);

  if (error) {
    return <p>Грешка при зареждането на постовете: {error}</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {posts.map((post) => (
        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer">
          <img
            src={post.media_url}
            alt="Instagram post"
            className="w-full h-auto rounded-xl hover:scale-105 transition-transform duration-300"
          />
        </a>
      ))}
    </div>
  );
};

export default InstagramFeed;
