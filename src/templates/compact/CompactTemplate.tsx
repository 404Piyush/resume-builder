import { useContext } from 'react';
import { SectionValidator } from '@/helpers/common/components/ValidSectionRenderer';
import { StateContext } from '@/modules/builder/resume/ResumeLayout';
import { AwardSection } from '@/templates/modern/components/Awards';
import { BasicIntro } from '@/templates/modern/components/BasicIntro';
import { EducationSection } from '@/templates/modern/components/Education';
import { Objective } from '@/templates/modern/components/Objective';
import { SkillsSection } from '@/templates/modern/components/Skills';
import { SummarySection } from '@/templates/modern/components/Summary';
import { VolunteerSection } from '@/templates/modern/components/Volunteer';
import { WorkSection } from '@/templates/modern/components/Work';

export default function CompactTemplate() {
  const resumeData = useContext(StateContext);

  return (
    <div className="p-5">
      <BasicIntro
        name={resumeData.basics.name}
        label={resumeData.basics.label}
        url={resumeData.basics.url}
        email={resumeData.basics.email}
        city={resumeData.basics.location.city}
        phone={resumeData.basics.phone}
        image={resumeData.basics.image}
        profiles={resumeData.basics.profiles}
      />

      <div className="mt-2">
        <SectionValidator value={resumeData.basics.summary}>
          <SummarySection summary={resumeData.basics.summary} />
        </SectionValidator>

        <SectionValidator value={resumeData.basics.objective}>
          <Objective objective={resumeData.basics.objective} />
        </SectionValidator>

        <SectionValidator value={resumeData.work}>
          <WorkSection experience={resumeData.work} />
        </SectionValidator>

        <SectionValidator value={resumeData.education}>
          <EducationSection education={resumeData.education} />
        </SectionValidator>

        <SectionValidator value={resumeData.skills.languages}>
          <SkillsSection title="Languages" list={resumeData.skills.languages} />
        </SectionValidator>

        <SectionValidator value={resumeData.skills.technologies}>
          <SkillsSection title="Technologies" list={resumeData.skills.technologies} />
        </SectionValidator>

        <SectionValidator value={resumeData.skills.frameworks}>
          <SkillsSection
            title="Frameworks & Libraries"
            list={resumeData.skills.frameworks.concat(resumeData.skills.libraries)}
          />
        </SectionValidator>

        <SectionValidator value={resumeData.skills.tools}>
          <SkillsSection title="Tools" list={resumeData.skills.tools} />
        </SectionValidator>

        <SectionValidator value={resumeData.awards}>
          <AwardSection awardsReceived={resumeData.awards} />
        </SectionValidator>

        <SectionValidator value={resumeData.volunteer}>
          <VolunteerSection volunteer={resumeData.volunteer} />
        </SectionValidator>
      </div>
    </div>
  );
}
