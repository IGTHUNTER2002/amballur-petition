-- Preserve existing signatures under their original text while updating the
-- supplied default wording for deployments that still use the initial version.
do $$
declare
  v_petition public.petitions%rowtype;
  v_current public.petition_versions%rowtype;
  v_new_version_id uuid;
begin
  select * into v_petition
  from public.petitions
  where slug = 'amballur-stray-dog-safety'
  for update;

  if not found then return; end if;

  select * into v_current
  from public.petition_versions
  where id = v_petition.published_version_id;

  if v_current.title_en <> 'Petition for humane stray dog public-safety action in Amballur' then return; end if;

  insert into public.petition_versions (
    petition_id, version_number, title_en, title_ml, recipient_en, recipient_ml,
    body_en, body_ml, requested_actions_en, requested_actions_ml,
    privacy_notice_en, privacy_notice_ml, created_by
  ) values (
    v_petition.id,
    v_current.version_number + 1,
    'Petition for action on stray-dog disturbance and public safety in Amballur',
    'അമ്പല്ലൂരിലെ തെരുവുനായ ശല്യത്തിനും പൊതുസുരക്ഷയ്ക്കുമുള്ള നടപടിക്കായുള്ള ഹർജി',
    v_current.recipient_en,
    v_current.recipient_ml,
    'Residents report that groups of free-roaming dogs are disrupting daily movement and creating fear around homes, roads, schools, and public spaces. We request a coordinated, lawful, and humane response that addresses these concerns, protects residents—especially children, older people, and pedestrians—and follows animal-welfare and public-health requirements. This petition seeks documented assessment, transparent communication, and effective action at reported locations.',
    'ഈ പഞ്ചായത്തിലെ താമസക്കാർ വീടുകൾ, റോഡുകൾ, സ്കൂളുകൾ, പൊതുസ്ഥലങ്ങൾ എന്നിവയ്ക്കു സമീപം കൂട്ടമായി സഞ്ചരിക്കുന്ന തെരുവുനായകൾ ദൈനംദിന യാത്രയ്ക്കും സുരക്ഷിതത്വബോധത്തിനും തടസമാകുന്നതായി അറിയിക്കുന്നു. കുട്ടികൾ, വയോധികർ, വഴിയാത്രക്കാർ ഉൾപ്പെടെയുള്ള താമസക്കാരുടെ സുരക്ഷ ഉറപ്പാക്കുകയും മൃഗക്ഷേമ-പൊതുജനാരോഗ്യ മാനദണ്ഡങ്ങൾ പാലിക്കുകയും ചെയ്യുന്ന ഏകോപിതവും നിയമാനുസൃതവും മാനുഷികവുമായ നടപടി സ്വീകരിക്കണമെന്നു ഞങ്ങൾ അഭ്യർത്ഥിക്കുന്നു. റിപ്പോർട്ട് ചെയ്ത സ്ഥലങ്ങളിൽ രേഖാമൂലമുള്ള വിലയിരുത്തൽ, സുതാര്യമായ അറിയിപ്പ്, ഫലപ്രദമായ നടപടി എന്നിവയാണ് ഈ ഹർജിയിലൂടെ ആവശ്യപ്പെടുന്നത്.',
    v_current.requested_actions_en,
    v_current.requested_actions_ml,
    v_current.privacy_notice_en,
    v_current.privacy_notice_ml,
    null
  ) returning id into v_new_version_id;

  update public.petitions
  set published_version_id = v_new_version_id
  where id = v_petition.id;
end;
$$;
