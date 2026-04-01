import Head from 'next/head';
import HomeLayout from '@/modules/home/HomeLayout';

function HomePage() {
  return (
    <div>
      <Head>
        <title>Cloud Computing Team Resume Builder</title>
        <meta
          name="description"
          content="Cloud Computing side project resume builder by Piyush, Nandini, and Daksh."
        />
        <link rel="icon" type="image/png" href="/icons/resume-icon.png" />
      </Head>

      <HomeLayout />
    </div>
  );
}

export default HomePage;
