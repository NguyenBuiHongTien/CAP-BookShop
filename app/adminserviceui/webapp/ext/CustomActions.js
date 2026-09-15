sap.ui.define([
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (MessageBox, MessageToast) {
  "use strict";


function findBooksTable() {
  var oFound = null;

  if (sap.ui.core.Element && sap.ui.core.Element.registry && sap.ui.core.Element.registry.forEach) {
    sap.ui.core.Element.registry.forEach(function (oControl) {
      if (oFound || !oControl || !oControl.isA) {
        return;
      }

      var bIsTable =
        oControl.isA("sap.ui.mdc.Table") ||
        oControl.isA("sap.m.Table") ||
        oControl.isA("sap.ui.table.Table");

      if (!bIsTable) {
        return;
      }

      var sId = oControl.getId ? oControl.getId() : "";
      if (sId.indexOf("Books") >= 0 && sId.indexOf("LineItem") >= 0) {
        oFound = oControl;
      }
    });
  }

  return oFound;
}

  return {
    onUploadExcel: function () {
      var oInput = document.createElement("input");
      oInput.type = "file";
      oInput.accept = ".xlsx,.xls";
      oInput.style.display = "none";
      document.body.appendChild(oInput);

      oInput.onchange = async function () {
        var oFile = oInput.files && oInput.files[0];
        document.body.removeChild(oInput);

        if (!oFile) {
          return;
        }

        try {
          // 1. Đọc file → Base64
          var sBase64 = await new Promise(function (resolve, reject) {
            var oReader = new FileReader();
            oReader.onload = function () {
              var sResult = oReader.result || "";
              resolve(sResult.indexOf(",") >= 0 ? sResult.split(",")[1] : sResult);
            };
            oReader.onerror = reject;
            oReader.readAsDataURL(oFile);
          });

          // 2. Gọi UploadService (upload-service.js)
          var oResponse = await fetch("/upload/uploadBooksFromBase64", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileName: oFile.name,
              fileBase64: sBase64
            })
          });

          var oJson = await oResponse.json();

          // OData action thường bọc trong "value"
          var oResult = oJson.value || oJson;

          if (!oResponse.ok || oJson.error) {
            var sErr =
              (oJson.error && oJson.error.message) ||
              (oResult && oResult.message) ||
              ("HTTP " + oResponse.status);
            throw new Error(sErr);
          }

          // 3. Hiển thị kết quả từ backend
          var sMessage = oResult.message || ("Inserted " + (oResult.inserted || 0) + " book(s)");
          var aErrors = oResult.errors || [];

          if (oResult.success) {
            MessageToast.show(sMessage);
            location.reload();
          } else {
            MessageBox.warning(
              sMessage + (aErrors.length ? "\n\n" + aErrors.join("\n") : ""),
              {
                
                  title: "Kết quả Upload",
                  actions: [MessageBox.Action.OK],
                  onClose: function () {
                    location.reload();             // chỉ reload khi người dùng bấm OK
                  }
                
              }
            );
          }

          // // 4. Refresh list Books
          // location.reload();

        } catch (oError) {
          console.error(oError);
          MessageBox.error("Upload failed: " + (oError.message || oError));
        }
      };

      oInput.click();
    },

    // ===== Nút Load Book từ RAP/ABAP =====
    onLoadFromABAP: async function () {
      try {
        const oResponse = await fetch("/admin/getBooksFromRAP", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        });


        const oJson = await oResponse.json();
        const oResult = oJson.value || oJson;

        // Vì backend trả về chuỗi
        const sMessage = typeof oResult === "string"
          ? oResult
          : (oResult.message || "Thành công");

        MessageBox.information(sMessage, {
            title: "Books from RAP",
            actions: [MessageBox.Action.OK],
            onClose: function () {
              // Refresh trang sau khi bấm OK
              location.reload();
            }
        });



        // Nếu sau này action sync vào DB CAP thì có thể:
        // location.reload();

      } catch (oError) {
        console.error(oError);
        MessageBox.error("Load from ABAP failed: " + (oError.message || oError));
      }
    },


    // ===== Upload Genres =====
    onUploadGenres: function () {
      var oInput = document.createElement("input");
      oInput.type = "file";
      oInput.accept = ".xlsx,.xls";
      oInput.style.display = "none";
      document.body.appendChild(oInput);

      oInput.onchange = async function () {
        var oFile = oInput.files && oInput.files[0];
        document.body.removeChild(oInput);

        if (!oFile) {
          return;
        }

        try {
          // 1. Đọc file → Base64
          var sBase64 = await new Promise(function (resolve, reject) {
            var oReader = new FileReader();
            oReader.onload = function () {
              var sResult = oReader.result || "";
              resolve(sResult.indexOf(",") >= 0 ? sResult.split(",")[1] : sResult);
            };
            oReader.onerror = reject;
            oReader.readAsDataURL(oFile);
          });

          // 2. Gọi UploadService – action Genres
          var oResponse = await fetch("/upload/uploadGenresFromBase64", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileName: oFile.name,
              fileBase64: sBase64
            })
          });

          var oJson = await oResponse.json();
          var oResult = oJson.value || oJson;

          if (!oResponse.ok || oJson.error) {
            var sErr =
              (oJson.error && oJson.error.message) ||
              (oResult && oResult.message) ||
              ("HTTP " + oResponse.status);
            throw new Error(sErr);
          }

          // 3. Hiển thị kết quả
          var sMessage = oResult.message ||
            ("Inserted " + (oResult.inserted || 0) +
             ", updated " + (oResult.updated || 0) + " genre(s)");
          var aErrors = oResult.errors || [];

          if (oResult.success) {
            MessageToast.show(sMessage);
            location.reload();
          } else {
            MessageBox.warning(
              sMessage + (aErrors.length ? "\n\n" + aErrors.join("\n") : ""),
              {
                title: "Kết quả Upload Genres",
                actions: [MessageBox.Action.OK],
                onClose: function () {
                  location.reload();
                }
              }
            );
          }

        } catch (oError) {
          console.error(oError);
          MessageBox.error("Upload Genres failed: " + (oError.message || oError));
        }
      };

      oInput.click();
    },

    // ===== Export Book =====
    onExportBooksExcel: async function (oBindingContext, aSelectedContexts) {
      try {
        // -------------------------------------------------
        // 1. Lấy các context đang hiển thị
        // -------------------------------------------------
        let aContexts = [];

        // Cách 1: Nếu người dùng đã chọn dòng (recommended)
        if (aSelectedContexts && aSelectedContexts.length > 0) {
          aContexts = aSelectedContexts;
        } 
        // Cách 2: Lấy tất cả dòng đang được filter + đang hiển thị trên table
        else {
              const oTable = findBooksTable();

              if (!oTable) {
                throw new Error("Không tìm thấy table Books trên màn hình");
              }

              const oBinding =
                oTable.getRowBinding?.() ||
                oTable.getBinding("items") ||
                oTable.getBinding("rows");

              if (!oBinding) {
                throw new Error("Không lấy được binding của table Books");
              }

              aContexts = oBinding.getCurrentContexts
                ? oBinding.getCurrentContexts()
                : (oBinding.getContexts ? oBinding.getContexts(0, oBinding.getLength()) : []);
        }

        // -------------------------------------------------
        // 2. Lấy danh sách ID
        // -------------------------------------------------
        const aBookIDs = aContexts
          .map(ctx => {
            // FE thường trả về context có getObject() hoặc getProperty()
            const oData = ctx.getObject ? ctx.getObject() : ctx.getProperty?.();
            return oData?.ID ?? ctx.getProperty?.("ID");
          })
          .filter(id => id !== undefined && id !== null);

        if (aBookIDs.length === 0) {
          sap.m.MessageBox.warning("Không có dòng nào đang hiển thị / được chọn để export");
          return;
        }

        // -------------------------------------------------
        // 3. Gọi backend
        // -------------------------------------------------
        const oResponse = await fetch("/export/exportBooksToExcel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            bookIDs: aBookIDs
          })
        });

        const oJson = await oResponse.json();
        const oResult = oJson.value || oJson;

        if (!oResponse.ok || oJson.error) {
          const sErr =
            (oJson.error && oJson.error.message) ||
            (oResult && oResult.message) ||
            ("HTTP " + oResponse.status);
          throw new Error(sErr);
        }

        if (!oResult.fileBase64) {
          throw new Error("No file data returned");
        }

        // -------------------------------------------------
        // 4. Download file
        // -------------------------------------------------
        const sByteCharacters = atob(oResult.fileBase64);
        const aByteNumbers = new Array(sByteCharacters.length);
        for (let i = 0; i < sByteCharacters.length; i++) {
          aByteNumbers[i] = sByteCharacters.charCodeAt(i);
        }
        const oByteArray = new Uint8Array(aByteNumbers);
        const oBlob = new Blob([oByteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const sFileName = oResult.fileName || "Books_Export.xlsx";
        const sUrl = window.URL.createObjectURL(oBlob);
        const oLink = document.createElement("a");
        oLink.href = sUrl;
        oLink.download = sFileName;
        document.body.appendChild(oLink);
        oLink.click();
        document.body.removeChild(oLink);
        window.URL.revokeObjectURL(sUrl);

        sap.m.MessageToast.show(oResult.message || `Exported ${aBookIDs.length} book(s)`);

      } catch (oError) {
        console.error(oError);
        sap.m.MessageBox.error("Export failed: " + (oError.message || oError));
      }
    }
  };
});