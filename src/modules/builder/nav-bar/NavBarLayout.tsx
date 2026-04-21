import { useCallback, useState } from 'react';
import { NavBarActions, NavBarMenu, StyledButton } from './atoms';

import { AVAILABLE_TEMPLATES } from '@/helpers/constants';
import Image from 'next/image';
import Link from 'next/link';
import { NavMenuItem } from './components/MenuItem';
import { TemplateSelect } from './components/TemplateSelect';
import { ThemeSelect } from './components/ThemeSelect';
import { Menu, MenuItem } from '@mui/material';

const TOTAL_TEMPLATES_AVAILABLE = Object.keys(AVAILABLE_TEMPLATES).length;

const NavBarLayout = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExportOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchor(null);
  };

  const exportAsPdf = useCallback(() => {
    globalThis?.print();
    handleExportClose();
  }, []);

  const exportAsWord = useCallback(() => {
    const resumeElement = document.getElementById('resume-document');
    if (!resumeElement) return;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${resumeElement.outerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleExportClose();
  }, []);

  return (
    <nav className="h-14 w-full bg-resume-800 relative flex py-2.5 pl-2 md:pl-5 pr-1 nd:pr-4 items-center shadow-level-8dp z-20 print:hidden">
      <Link href="/">
        <Image src={'/icons/resume-icon.png'} alt="logo" height="36" width="36" />
      </Link>
      <div className="flex-auto flex justify-between items-center xs:ml-3 md:ml-5">
        <NavBarMenu>
          <NavMenuItem
            caption={`Templates (${TOTAL_TEMPLATES_AVAILABLE})`}
            popoverChildren={<TemplateSelect />}
          />
          <NavMenuItem caption="Colours" popoverChildren={<ThemeSelect />} />
        </NavBarMenu>
        <div className="hidden md:flex">
          <NavBarActions>
            <StyledButton variant="text" onClick={handleExportOpen}>
              Export
            </StyledButton>
          </NavBarActions>
        </div>
        <button
          className="flex md:hidden text-white"
          onClick={handleMenuOpen}
          aria-label="Open menu"
        >
          <Image src="/icons/more-horizontal.svg" alt="back" width={25} height={25} />
        </button>
      </div>
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={handleExportClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={exportAsPdf}>Export as PDF</MenuItem>
        <MenuItem onClick={exportAsWord}>Export as Word (.doc)</MenuItem>
      </Menu>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={exportAsPdf}>Export as PDF</MenuItem>
        <MenuItem onClick={exportAsWord}>Export as Word (.doc)</MenuItem>
      </Menu>
    </nav>
  );
};

export default NavBarLayout;
