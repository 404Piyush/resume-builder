import { Divider, styled, alpha } from '@mui/material';
import Link from '@mui/material/Link';
import { OutlinedButton } from '@/helpers/common/atoms/Buttons';

import { TemplateSlider } from './TemplatesSlider';

export const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.resume[800],
  borderColor: theme.palette.resume[100],
  ':hover': {
    borderColor: theme.palette.resume[800],
    backgroundColor: alpha(theme.palette.resume[800], 0.04),
  },
}));

export const TemplateSelect = () => {
  return (
    <div
      className={`md:h-[459px] md:w-[600px] bg-white flex flex-col px-3 md:px-10 py-[23px] shadow-2xl`}
    >
      <TemplateSlider />
      <Divider />
      <span className="text-resume-800 font-bold text-lg my-[14px]">
        Want to customize your own template?
      </span>
      <div>
        <OutlinedButton
          onClick={() => {
            window.open('/builder', '_self');
          }}
        >
          Continue Editing
        </OutlinedButton>
      </div>
    </div>
  );
};
