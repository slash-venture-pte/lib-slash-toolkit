// strings Constant.js
/*
  Statistic retrieve or stored
*/

const Lib = {};
exports.init = (strings) => {
  Lib.strings = strings || {
    S_MSG: {
      password_changed: 'Your password has been changed successfully!',
    },
    V_MSG: {
      user_not_register_phone: 'User is not registered.\n\nPlease use your country code if you are outside your country.',
      user_not_register_phone_forgot_pass: 'Your account could not be found. Please, try again.\n\nPlease use your country code if you are outside your country.',
      user_not_register_forgot_pass: 'Your account could not be found. Please, try again.',
      user_not_register: 'User is not registered.',
      password_required: 'Password is required.',
      password_incorrect: 'Password is incorrect.',
      password_min_len: 'Password must be at least 8 characters.',
      password_char_check: 'Password must be at least 8 characters and having a letter and number.',
      email_required: 'Email address is required.',
      email_invalid: 'Email address is invalid.',
      email_taken: 'Email address is already taken.',
      phone_required: 'Phone number is required.',
      country_code_required: 'Country code is required.',
      country_required: 'Country is required.',
      country_code_invalid: 'Country code must be a valid number.',
      phone_invalid: 'Phone must be a valid number.',
      phone_length_invalid: 'Phone number must be between 6 to 12 digits.',
      phone_taken: 'Phone number is already taken.',
      old_pwd_required: 'Old password is required.',
      new_pwd_required: 'New password is required.',
      confirm_pwd_required: 'Confirm Password is required.',
      password_not_matched: 'Password is not matched.',
      password_confirm_not_matched: 'Password Confirm is not matched.',
      password_same_as_old: 'You cannot change to the same as your current password!',
      email_same_as_old: 'You cannot change to the same as your current email!',
      phone_same_as_old: 'You cannot change to the same as your current phone!',
      email_available: 'Email is available.',
      phone_available: 'Phone is available.',
      account_no_pwd: 'Your account does not have password set yet.',
      account_pwd: 'Your account already have password set.',
      account_token_required: 'Account token is required.',
      account_token_invalid: 'Account token is invalid.',
      verify_code_required: 'Verification code is required.',
      verify_code_invalid: 'Verification code is invalid.',
      verify_code_valid: 'Verification code is correct and valid.',
      verify_code_expired: 'Verification code has been expired.',
      password_set: 'You have set password successfully!',
      email_change_request: 'You have requested to change email successfully. A verification code is being sent to your email.',
      phone_change_request: 'You have requested to change phone successfully. A verification code is being sent to your phone number.',
      email_cng_token_required: 'Email Change token is required.',
      email_cng_token_invalid: 'Email Change token is invalid.',
      phone_cng_token_required: 'Phone Change token is required.',
      phone_cng_token_invalid: 'Phone Change token is invalid.',
      photo_not_found: 'Your photo could not be found.',
      video_id_invalid: 'Video id is invalid.',
      video_not_found: 'Your video could not be found.',
      video_deleted: 'Your video has been deleted successfully.',
      upload_key_required: 'Upload session key is required.',
      upload_key_duplicated: 'Upload session key is already existed.',
      media_not_found: 'Media is not found.',
      contact_user_required: 'Contact to add is required.',
      contact_user_not_found: 'Contact to add cannot be found.',
      contact_user_invalid: 'Contact to add is invalid.',
      contact_user_already_add: 'This contact is already in your contact list.',
      contact_list_required: 'Contacts list is required.',
      contact_list_invalid: 'Contact list is invalid.',
      contact_group_name_required: 'Contact group name is required.',
      contact_group_id_not_valid: 'Contact group ID is not valid.',
      contact_group_id_is_required: 'Contact group ID is required.',
      contact_group_not_found: 'Contact group is not found.',
      contact_group_no_permission_delete: 'You do not have permission to remove this contact group.',
      contact_group_no_permission_update: 'You do not have permission to update this contact group.',
      contact_group_no_permission_add: 'You do not have permission to add member to this contact group.',
      contact_group_no_permission_remove: 'You do not have permission to remove member from this contact group.',
      contact_group_no_permission_access: 'You do not have permission to access this contact group.',
      contact_group_member_required: 'Contact group member is required.',
      contact_group_member_not_valid: 'Contact group member is not valid.',
      contact_group_member_already_add: 'This user is already in the group.',
      contact_group_member_not_in_group: 'This user is not in the group.',
      contact_group_member_cannot_remove_admin: 'You cannot remove admin group member.',
      contact_group_cannot_leave: 'You are not in this group.',
      media_act_user_not_contact: 'You cannot give photo/video to people not from your contact.',
      media_act_cannot_yourself: 'You cannot give to yourself!',
      media_act_user_required: 'User id for give photo(s)/video(s) is required.',
      media_act_media_not_match: 'Media(s) to give does not match in the database.',
    },
  };
};

exports.setStrings = (strings) => {
  Lib.strings = strings;
};

exports.getStrings = () => Lib.strings;

exports.capitalize = (string) => {
  const strings = string.split('_');
  if (strings.length <= 0) return string;
  let capitalString = '';
  for (let i = 0; i < strings.length; i += 1) {
    capitalString += strings[i].charAt(0).toUpperCase() + strings[i].slice(1);
  }
  return capitalString;
};
