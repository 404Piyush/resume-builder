import { motion } from 'framer-motion';
import { NavBarActions, StyledButton } from '../builder/nav-bar/atoms';

import { Button } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import Person from './components/Person';

const HomeLayout = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scroll-smooth">
      <nav className="sticky top-0 z-20 h-14 w-full bg-resume-800 flex py-2.5 px-4 xl:px-60 items-center shadow-level-8dp">
        <Link href="/">
          <Image src={'/icons/resume-icon.png'} alt="logo" height="36" width="36" />
        </Link>
        <div className="flex-auto flex justify-between items-center ml-5">
          <NavBarActions>
            <Link href="/builder" passHref={true}>
              <StyledButton variant="text">Editor</StyledButton>
            </Link>
          </NavBarActions>
          <NavBarActions>
            <Link href="/login" passHref={true}>
              <StyledButton variant="text">Login</StyledButton>
            </Link>
            <Link href="/register" passHref={true}>
              <StyledButton variant="text">Register</StyledButton>
            </Link>
            <Link href="#about-us" passHref={true}>
              <StyledButton variant="text">Team</StyledButton>
            </Link>
          </NavBarActions>
        </div>
      </nav>
      <div
        id="about-us"
        className="mx-6 md:mx-40 xl:mx-60 my-20"
        style={{ fontFamily: "'Roboto Slab', serif", minHeight: 'calc(100vh - 56px)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-resume-800 text-4xl mb-2 text-center lg:text-left">Team</h1>
            <p className="text-resume-400 text-center lg:text-left">
              Cloud Computing resume builder project by student contributors.
            </p>
          </div>
          <Link href="/builder" passHref={true}>
            <Button variant="contained" className="bg-resume-800">
              OPEN BUILDER
            </Button>
          </Link>
        </div>
        <p className="text-resume-800 mb-8 text-center lg:text-left">
          Focus: AWS deployment readiness and MongoDB Atlas integration workflow.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Person />
        </div>
      </div>
    </motion.div>
  );
};

export default HomeLayout;
