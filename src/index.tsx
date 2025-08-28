import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/AccountSettings";
import Products from "./pages/Products";
import Addnew from "./pages/Addnew";
import ModifyProduct from "./pages/ModifyProduct";
import FacturePage from "./pages/Facture";
import Factures from "./pages/Factures";
import InvoiceMonth from "./pages/FactureMounth";
import InvoiceYear from "./pages/FactureYear";
import ClientInvoice from "./pages/ClientInvoice"; // Add this import
import ExpensesFacture from "./pages/ExpensessFacture";
import DayInvoice from "./pages/DayInvoice";

render(() => 
    <Router>
        <Route path="/" component={App} />
        <Route path="/profile" component={Profile} />
        <Route path="/compte" component={AccountSettings} />
        <Route path="/factures" component={Factures}/>
        <Route path="/produits" component={Products}/>
        <Route path="/produits/new" component={Addnew}/>
        <Route path="/produit/modify/:id" component={ModifyProduct} />
        <Route path="/facture/:id" component={FacturePage} />
        <Route path="/invoice/:year" component={InvoiceYear} />
        <Route path="/invoice/:year/:month" component={InvoiceMonth} />
        <Route path="/invoice/client/:clientName" component={ClientInvoice} />
<Route path="/expenses-invoice/year/:year" component={ExpensesFacture} />
<Route path="/expenses-invoice/month/:year/:month" component={ExpensesFacture} />
<Route path="/expenses-invoice/day/:date" component={ExpensesFacture} />
<Route path={"/invoice/day/:day"}  component={DayInvoice} />
      
    </Router>
, document.getElementById("root") as HTMLElement);
