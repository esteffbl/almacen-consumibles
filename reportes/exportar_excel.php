<?php
/**
 * MÓDULO EXPORTADOR DE INVENTARIO OFICIAL A EXCEL (.XLS) CON MEMBRETE OFICIAL
 * Genera el documento idéntico al Excel oficial de Pequiven / Ministerio
 */

require_once __DIR__ . '/../modelo/Consumible.php';

$reportNum = isset($_GET['num']) ? preg_replace('/[^0-9]/', '', $_GET['num']) : '18';
$fechaParam = isset($_GET['fecha']) ? $_GET['fecha'] : date('d/m/Y');

if (strpos($fechaParam, '-') !== false) {
    $parts = explode('-', $fechaParam);
    if (count($parts) === 3) {
        $fechaActual = (int)$parts[2] . '/' . (int)$parts[1] . '/' . $parts[0];
        $fechaFile = $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    } else {
        $fechaActual = $fechaParam;
        $fechaFile = date('d-m-Y');
    }
} else {
    $fechaActual = $fechaParam;
    $fechaFile = date('d-m-Y');
}

// URL absoluta para que Excel ajuste la imagen y no se solape
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$imgUrl = $protocol . $host . '/consumibles/vistas/Imagen1.jpg';

$items = Consumible::obtenerTodos();

header('Content-Type: application/vnd.ms-excel; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $reportNum . '.INVENTARIO DE ALMACEN ACTUALIZADO AL ' . $fechaFile . '.xls"');
header('Cache-Control: max-age=0');

echo "\xEF\xBB\xBF"; // UTF-8 BOM para Excel
?>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>RESUMEN DINAMICO</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; }
    .title-main { font-size: 16pt; font-weight: bold; text-align: center; font-family: Arial, sans-serif; }
    .title-sub { font-size: 11pt; font-weight: bold; text-align: center; font-family: Arial, sans-serif; color: #000000; }
    .title-date { font-size: 10pt; font-weight: bold; text-align: center; font-family: Arial, sans-serif; }
    .th-header { background-color: #D9E1F2; color: #000000; font-weight: bold; border: 1px solid #8EA9DB; text-align: center; padding: 8px; font-size: 10pt; }
    .td-ruta { font-weight: bold; text-align: center; border: 1px solid #D9D9D9; background-color: #F8FAFC; font-size: 9pt; }
    .td-name { text-align: left; border: 1px solid #D9D9D9; font-weight: bold; font-size: 9pt; }
    .td-num { text-align: center; border: 1px solid #D9D9D9; font-size: 9pt; }
    .td-ent { text-align: center; border: 1px solid #D9D9D9; color: #059669; font-weight: bold; font-size: 9pt; }
    .td-sal { text-align: center; border: 1px solid #D9D9D9; color: #DC2626; font-weight: bold; font-size: 9pt; }
    .td-stock-zero { text-align: center; border: 1px solid #D9D9D9; font-weight: bold; background-color: #FF6B6B; color: #FFFFFF; font-size: 9pt; }
    .td-stock-normal { text-align: center; border: 1px solid #D9D9D9; font-weight: bold; background-color: #E2EFDA; color: #276749; font-size: 9pt; }
  </style>
</head>
<body>
  <table>
    <tr style="height: 75pt;">
      <td colspan="6" style="height: 75pt; text-align: center; vertical-align: middle; background-color: #FFFFFF;">
        <img src="<?php echo $imgUrl; ?>" height="85" style="display:block; margin: 0 auto;" alt="Membrete Hidrocarburos Pequiven" />
      </td>
    </tr>
    <tr style="height: 10pt;"><td colspan="6"></td></tr>
    <tr style="height: 25pt;"><td colspan="6" class="title-main" style="vertical-align: middle;">INVENTARIO</td></tr>
    <tr style="height: 20pt;"><td colspan="6" class="title-sub" style="vertical-align: middle;">RESUMEN DE INVENTARIO DE EQUIPOS HERRAMIENTAS REPUESTOS Y CONSUMIBLES</td></tr>
    <tr style="height: 20pt;"><td colspan="6" class="title-date" style="vertical-align: middle;"><?php echo htmlspecialchars($fechaActual); ?></td></tr>
    <tr style="height: 12pt;"><td colspan="6"></td></tr>
    <tr style="height: 24pt;">
      <th class="th-header" style="width: 70px; vertical-align: middle;">RUTA</th>
      <th class="th-header" style="width: 380px; vertical-align: middle;">CONSUMIBLES</th>
      <th class="th-header" style="width: 140px; vertical-align: middle;">ENTRADA INICIAL</th>
      <th class="th-header" style="width: 120px; vertical-align: middle;">ENTRADA</th>
      <th class="th-header" style="width: 120px; vertical-align: middle;">SALIDA</th>
      <th class="th-header" style="width: 160px; vertical-align: middle;">INVENTARIO FINAL</th>
    </tr>
    <?php 
    if ($items): 
      foreach ($items as $item): 
        $stk = (int)$item['stock'];
        $ini = (int)($item['entrada_inicial'] ?? 0);
        $ent = (int)($item['entrada'] ?? 0);
        $sal = (int)($item['salida'] ?? 0);

        $stockClass = ($stk === 0) ? 'td-stock-zero' : 'td-stock-normal';
        $entStr = $ent > 0 ? $ent : '';
        $salStr = $sal > 0 ? $sal : '';
        $iniStr = $ini > 0 ? $ini : ($stk > 0 ? $stk : '');
    ?>
    <tr style="height: 20pt;">
      <td class="td-ruta" style="vertical-align: middle;"><?php echo $item['id']; ?></td>
      <td class="td-name" style="vertical-align: middle;"><?php echo htmlspecialchars($item['item']); ?></td>
      <td class="td-num" style="vertical-align: middle;"><?php echo $iniStr; ?></td>
      <td class="td-ent" style="vertical-align: middle;"><?php echo $entStr; ?></td>
      <td class="td-sal" style="vertical-align: middle;"><?php echo $salStr; ?></td>
      <td class="<?php echo $stockClass; ?>" style="vertical-align: middle;"><?php echo $stk; ?></td>
    </tr>
    <?php endforeach; endif; ?>
  </table>
</body>
</html>
