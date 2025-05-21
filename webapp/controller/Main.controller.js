//formatter.formatCurrency
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",  
    
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button"
], (Controller, Filter, FilterOperator, MessageToast, Fragment,Dialog,Input,Button) => {
    "use strict";

    return Controller.extend("logaligroup.practica2.controller.Main", {
        onInit() {
            var v = this.getView();
            var oUiModel = this.getOwnerComponent().getModel("ui");
            if (!oUiModel) {
                //create a new json model if not defined
                oUiModel = new sap.ui.model.json.JSONModel({
                    headerExpaanded: true,
                    filters: {
                        productName: "",
                        category: "",
                        supplier: "",
                        stockStatus: ""
                    }
                });
            }
            v.setModel(oUiModel, "ui")
        },
        //formatter for stock statust text
        formatStockStatus: function (iUnitsInStock) {
            if (iUnitsInStock === 0) {
                return this.getView().getModel("i18n").getResourceBundle().getText("stockOutOfStock");

            } else if (iUnitsInStock < 20) {
                return this.getView().getModel("i18n").getResourceBundle().getText("stockLowStock");

            }
            return this.getView().getModel("i18n").getResourceBundle().getText("stockInStock");
        },
        //formatter for stock sttaus state(color)

        formatStockStatusStates: function (iUnitsInStock) {
            if (iUnitsInStock === 0) {
                return "Error";
            } else if (iUnitsInStock < 20) {
                return "Warning";
            }else if(iUnitsInStock >0){
                return "Success";

            }
            return "None";
        },

        //formatter for price (converts string to float)
        formatPrice: function (sPrice) {
            return parseFloat(sPrice) || 0;
        },


        //formaatter for currency display
        formatter: {
            formatCurrency: function (fValue) {
                return new sap.ui.model.type.Currency().formatValue([fValue, "USD"], "string");

            }
        },

        //Handle filter input change 
        onFilterChange: function (oEvent) {
            var v = this.getView();
            var oUiModel = v.getModel("ui");
            if (!oUiModel) {
                sap.m.MessageToast.show("UI model not found. Please refresh the application");
                return;
            }
            clearTimeout(this._filterTimeout);
            this._filterTimeout = setTimeout(() => {
                var oBinding = v.byId("productTable").getBinding("rows");
                oBinding.filter(this._getFilters());
                oBinding.refresh(true);
                oBinding.attachEventOnce("dataReceived", (oEvent) => {
                    var oBinding = v.byId("productTable").getBinding("rows");
                    oBinding.filter(this._getFilters());
                    oBinding.refresh(true);
                    oBinding.refresh(true);
                    oBinding.attachEventOnce("dataReceived", (oEvent) => {
                        var iCount = oEvent.getParameter("data")?.results?.length || 0;
                        if (iCount === 0) {
                            sap.m.MessageToast.show("No products match the selected filters");
                        }
                    });
                }, 300);
            }, 300);
            this.getView().byId("productTable").getBinding("rows").filter(this._getFilters());
        },

        //Handle stock status radio button seleccion
        onStockStatusSelect: function (oEvent) {
            var v = this.getView();//local variable 'v' for brevity
            var iIndex = oEvent.getParameter("selectedIndex");
            var sStockStatus = iIndex === 0 ? "InStock" : iIndex === 1 ? "LowStock" : iIndex === 2 ? "OutOfStock" : "";
            v.getModel("ui").setProperty("/filters/stockStatus", sStockStatus);
            v.byId("productTable").getBinding("rows").filter(this._getFilters());
        },

        //Build filters for the table
        _getFilters: function () {
            var v = this.getView(); //local variable 'v' for brevity
            var oFilters = v.getModel("ui").getProperty("/filters");
            var aFilters = [];

            //Product Name filter
            if (oFilters.productName) {
                aFilters.push(new Filter("ProductName", FilterOperator.Contains, oFilters.productName));
            }
            //Category filter
            if (oFilters.category) {
                aFilters.push(new Filter("CategoryID", FilterOperator.EQ, oFilters.category));

            }
            if (oFilters.supplier) {
                aFilters.push(new Filter("SupplierID", FilterOperator.EQ, oFilters.supplier));
            }

            //Stock Status filter
            if (oFilters.stockStatus) {
                if (oFilters.stockStatus === "InStock") {
                    aFilters.push(new Filter("UnitsInStock", FilterOperator.GE, 20));
                } else if (oFilters.stockStatus === "LowStock") {
                    aFilters.push(new Filter([
                        new Filter("UnitsInStock", FilterOperator.GT, 0),
                        new Filter("UnitsInStock", FilterOperator.LT, 20)
                    ], true));

                } else if (oFilters.stockStatus === "OutOfStock") {
                    aFilters.push(new Filter("UnitsInStock", FilterOperator.EQ, 0));
                }
            }
            return aFilters;
        },
        //Clear all filters
        onClearFilters: function () {
            var v = this.getView(); //local variable 'v' for brevity
            v.getModel("ui").setData({
                headerExpaanded: true,
                filters: {
                    productName: "",
                    category: "",
                    supplier: "",
                    stockStatus: ""
                }
            });
            v.byId("productTable").getBinding("rows").filter([]);
        },

        //Show product details in a popover

        onDetailsPress: function (oEvent) {
            var v = this.getView(); //local variable 'v' fro brevity
            var oContext = oEvent.getSource().getBindingContext();
            var oSourceControl = oEvent.getSource();

            if (!this._pPopover) {
                //'_pPopover' is a controller property (promise) to store the popover fragment
                //Named with '_p' prefix to indicete a priveate promise

                this._pPopover = Fragment.load({
                    id: v.getId(),
                    name: "logaligroup.practica2.fragments.CardFragment",
                
                    controller:this
                   
                }).then(function (oPopover) {
                    v.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function (oPopover) {
                oPopover.bindElement(oContext.getPath());
                oPopover.openBy(oSourceControl);
            });

        },
        onEditPress: function () {
            var v = this.getView();
            var oTable = v.byId("productTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            
            if (aSelectedIndices.length === 0) {
                MessageToast.show("Por favor, selecciona al menos un producto para editar.");
                return;
            }

            // Crear un diálogo para editar el precio
            if (!this._oEditDialog) {
                this._oEditDialog = new Dialog({
                    title: "Editar Precio",
                    content: [
                        new Input({
                            id: "editPriceInput",
                            placeholder: "Nuevo precio (USD)",
                            type: "Number"
                        })
                    ],
                    beginButton: new Button({
                        text: "Guardar",
                        press: () => {
                            var sNewPrice = sap.ui.getCore().byId("editPriceInput").getValue();
                            if (!sNewPrice || isNaN(sNewPrice)) {
                                MessageToast.show("Por favor, ingresa un precio válido.");
                                return;
                            }
                            aSelectedIndices.forEach((iIndex) => {
                                var oContext = oTable.getContextByIndex(iIndex);
                                oContext.getModel().setProperty(oContext.getPath() + "/UnitPrice", parseFloat(sNewPrice));
                            });
                            oTable.getBinding("rows").refresh(true);
                            MessageToast.show("Precio actualizado para los productos seleccionados.");
                            this._oEditDialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: "Cancelar",
                        press: () => {
                            this._oEditDialog.close();
                        }
                    })
                });
                v.addDependent(this._oEditDialog);
            }
            this._oEditDialog.open();
        },

        onDeletePress: function () {
            var v = this.getView();
            var oTable = v.byId("productTable");
            var aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageToast.show("Por favor, selecciona al menos un producto para eliminar.");
                return;
            }

            // Crear un diálogo de confirmación
            if (!this._oDeleteDialog) {
                this._oDeleteDialog = new Dialog({
                    title: "Confirmar Eliminación",
                    content: new Text({
                        text: "¿Estás seguro de que deseas eliminar los productos seleccionados?"
                    }),
                    beginButton: new Button({
                        text: "Eliminar",
                        press: () => {
                            var oModel = oTable.getBinding("rows").getModel();
                            var aData = oModel.getProperty("/Products");
                            var aNewData = aData.filter((oItem, iIndex) => !aSelectedIndices.includes(iIndex));
                            oModel.setProperty("/Products", aNewData);
                            oTable.clearSelection();
                            MessageToast.show("Productos eliminados.");
                            this._oDeleteDialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: "Cancelar",
                        press: () => {
                            this._oDeleteDialog.close();
                        }
                    })
                });
                v.addDependent(this._oDeleteDialog);
            }
            this._oDeleteDialog.open();
        },

        onSharePress: function () {
            var v = this.getView();
            var oTable = v.byId("productTable");
            var aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageToast.show("Por favor, selecciona al menos un producto para compartir.");
                return;
            }

            var aSelectedProducts = aSelectedIndices.map(iIndex => {
                var oContext = oTable.getContextByIndex(iIndex);
                return oContext.getObject();
            });
            var sText = aSelectedProducts.map(oProduct => 
                `Producto: ${oProduct.ProductName}, Precio: ${oProduct.UnitPrice} USD`
            ).join("\n");

            if (navigator.clipboard) {
                navigator.clipboard.writeText(sText).then(() => {
                    MessageToast.show("Productos copiados al portapapeles.");
                });
            } else {
                MessageToast.show("Función de compartir no soportada en este navegador.");
            }
        },

        onAccept: function (oEvent) {
            var v = this.getView();
            var oTable = v.byId("productTable");
            var aSelectedIndices = oTable.getSelectedIndices();

            if (oEvent.getSource().getParent().getMetadata().getName() === "sap.m.OverflowToolbar") {
                // Acción del botón en el footer
                if (aSelectedIndices.length === 0) {
                    MessageToast.show("Por favor, selecciona al menos un producto para aceptar.");
                    return;
                }
                aSelectedIndices.forEach(iIndex => {
                    var oContext = oTable.getContextByIndex(iIndex);
                    oContext.getModel().setProperty(oContext.getPath() + "/Status", "Accepted");
                });
                oTable.getBinding("rows").refresh(true);
                MessageToast.show("Productos aceptados.");
            } else {
                // Acción del botón en la tabla
                var oContext = oEvent.getSource().getBindingContext();
                oContext.getModel().setProperty(oContext.getPath() + "/Status", "Accepted");
                oTable.getBinding("rows").refresh(true);
                MessageToast.show(`Producto ${oContext.getProperty("ProductName")} aceptado.`);
            }
        },

        onReject: function (oEvent) {
            var v = this.getView();
            var oTable = v.byId("productTable");
            var oContext = oEvent.getSource().getBindingContext();
            
            oContext.getModel().setProperty(oContext.getPath() + "/Status", "Rejected");
            oTable.getBinding("rows").refresh(true);
            MessageToast.show(`Producto ${oContext.getProperty("ProductName")} rechazado.`);
        }
    });
});