// Arquivo para remover autocomplete styling
export default function RemoveAutocomplete() {
  return (
    <style>{`
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px transparent inset !important;
        -webkit-text-fill-color: #ffffff !important;
      }
    `}</style>
  )
}
