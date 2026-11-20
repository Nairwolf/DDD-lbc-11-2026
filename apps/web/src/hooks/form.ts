import { createFormHook } from '@tanstack/react-form'

import {
  PasswordField,
  Select,
  SubscribeButton,
  TextArea,
  TextField,
} from '../components/FormComponents'
import { fieldContext, formContext } from './form-context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    PasswordField,
    Select,
    TextArea,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
