export type UserInfoDomain = {
  
  Username: string,
  email: string,
  email_verified: boolean,
  given_name: string,
  family_name: string,
  Enabled: boolean,
  UserStatus: string,
  phone_number:string,
  phone_number_verified: boolean,
  custom:{organization:string, role: string},
  UserCreateDate: string,
  UserLastModifiedDate: string
}