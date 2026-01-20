export type RoleType = 'user' | 'trainer'

export interface RoleCardData {
  type: RoleType
  title: string
  description: string
  tags: string[]
  accentColor: 'user' | 'trainer'
}
