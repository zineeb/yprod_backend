import vine, {SimpleMessagesProvider} from '@vinejs/vine'

export const registerUserSchema = vine.compile(
  vine.object({
    full_name: vine.string().minLength(2).maxLength(255),
    email: vine.string().email().unique({table: 'users', column: 'email'}),
    password: vine.string().minLength(2).maxLength(32),
  })
)

export const loginUserSchema = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(2).maxLength(32),
  })
)


const messages = {
  'full_name.minLength': 'Le nom doit contenir au moins 2 caractères.',
  'full_name.maxLength': 'Le nom ne doit pas dépasser 255 caractères.',
  'email.email': 'Le format de l’email est invalide.',
  'email.unique': 'Cette adresse e-mail est déjà utilisée.',
  'password.minLength': 'Le mot de passe doit faire au moins 2 caractères.',
  'password.maxLength': 'Le mot de passe ne doit pas dépasser 32 caractères.',
}

vine.messagesProvider = new SimpleMessagesProvider(messages)
