// Le bouton retour flottant a été retiré : les pages (Collection, Contact)
// ont déjà un bouton retour propre dans leur barre de navigation.
// On garde ce composant en simple conteneur pour ne pas changer App.jsx.
export default function SwipeBack({ children }) {
  return <>{children}</>;
}
