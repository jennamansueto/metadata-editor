<?php
/**
 * PDF Cover Page Template
 *
 * Supports three design layouts configured via admin Site Configurations:
 *   - default : full-width colored banner
 *   - minimal : clean layout with thin accent line
 *   - modern  : vertical side stripe
 *
 * Variables passed in:
 *   $project  - project row array (title, idno, type)
 *   $cover    - array with keys: primary_color, text_color, accent_color, design, logo, logo_abs
 */

$primary   = isset($cover['primary_color']) ? htmlspecialchars($cover['primary_color']) : '#0969da';
$text_col  = isset($cover['text_color'])    ? htmlspecialchars($cover['text_color'])    : '#ffffff';
$accent    = isset($cover['accent_color'])  ? htmlspecialchars($cover['accent_color'])  : '#0969da';
$design    = isset($cover['design'])        ? $cover['design']                          : 'default';
$logo_abs  = isset($cover['logo_abs'])      ? $cover['logo_abs']                        : '';

$title       = htmlspecialchars($project['title']);
$idno        = htmlspecialchars($project['idno']);
$date        = date("F j, Y");
$type_label  = ($project['type'] == 'survey') ? 'Microdata' : ucfirst($project['type']);

// Logo HTML (used inside mPDF - must be absolute path)
$logo_html = '';
if (!empty($logo_abs)) {
    $logo_html = '<img src="' . $logo_abs . '" style="max-width:180px;max-height:80px;" />';
}
?>

<?php if ($design === 'minimal'): ?>
<!-- MINIMAL DESIGN -->
<?php if (!empty($logo_html)): ?>
<div style="text-align:right;margin-bottom:20px;">
    <?php echo $logo_html; ?>
</div>
<?php endif; ?>

<div style="margin-top:200px;border-top:4px solid <?php echo $accent; ?>;padding-top:30px;text-align:right;">
    <div style="font-size:2.5em;color:#333333;line-height:1.2;">
        <?php echo $title; ?>
    </div>
</div>

<div style="text-align:right;margin-top:20px;">
    <div style="font-size:12pt;color:<?php echo $accent; ?>;font-weight:bold;">
        <?php echo $idno; ?>
    </div>
    <div style="margin-top:5px;font-size:12pt;color:gray;">
        <?php echo t('Report generated on'); ?>: <?php echo $date; ?>
    </div>
    <div style="margin-top:5px;font-size:12pt;color:gray;">
        Project type: <?php echo $type_label; ?>
    </div>
</div>

<?php elseif ($design === 'modern'): ?>
<!-- MODERN DESIGN -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr>
    <td width="60" style="background-color:<?php echo $primary; ?>;vertical-align:top;">&nbsp;</td>
    <td style="padding-left:30px;vertical-align:top;">

        <?php if (!empty($logo_html)): ?>
        <div style="margin-top:30px;margin-bottom:30px;">
            <?php echo $logo_html; ?>
        </div>
        <?php endif; ?>

        <div style="margin-top:200px;font-size:2.5em;color:#333333;line-height:1.2;">
            <?php echo $title; ?>
        </div>

        <div style="margin-top:20px;font-size:12pt;color:<?php echo $accent; ?>;font-weight:bold;">
            <?php echo $idno; ?>
        </div>

        <div style="margin-top:10px;font-size:12pt;color:gray;">
            <?php echo t('Report generated on'); ?>: <?php echo $date; ?>
        </div>
        <div style="margin-top:5px;font-size:12pt;color:gray;">
            Project type: <?php echo $type_label; ?>
        </div>

    </td>
</tr>
</table>

<?php else: ?>
<!-- DEFAULT DESIGN -->
<?php if (!empty($logo_html)): ?>
<div style="text-align:right;padding:15px;">
    <?php echo $logo_html; ?>
</div>
<?php endif; ?>

<div style="width:100%;background-color:<?php echo $primary; ?>;">
    <div style="padding:10px;padding-top:300px;text-align:right;font-size:3em;color:<?php echo $text_col; ?>;">
        <?php echo $title; ?>
    </div>
</div>

<div style="text-align:right;">
    <div style="margin-top:20px;font-size:12pt;color:<?php echo $accent; ?>;font-weight:bold;">
        <?php echo $idno; ?>
    </div>
    <div style="margin-top:5px;font-size:12pt;color:gray;">
        <?php echo t('Report generated on'); ?>: <?php echo $date; ?>
        <div style="margin-top:15px;">Project type: <?php echo $type_label; ?></div>
    </div>
</div>
<?php endif; ?>
