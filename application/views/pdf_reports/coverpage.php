<?php
/**
 * PDF Cover Page Template
 *
 * Supports three design layouts: default, minimal, modern.
 * All colors, logo, and design choice are configurable via admin settings.
 */

// Extract settings with safe defaults
$primary_color   = isset($pdf_cover_primary_color)   ? $pdf_cover_primary_color   : '#0969da';
$text_color      = isset($pdf_cover_text_color)      ? $pdf_cover_text_color      : '#ffffff';
$secondary_color = isset($pdf_cover_secondary_color) ? $pdf_cover_secondary_color : '#0969da';
$design          = isset($pdf_cover_design)          ? $pdf_cover_design          : 'default';
$logo_path       = isset($pdf_cover_logo_abs)        ? $pdf_cover_logo_abs        : '';

$title       = isset($project['title']) ? $project['title'] : '';
$idno        = isset($project['idno'])  ? $project['idno']  : '';
$project_type = isset($project['type']) ? ($project['type'] == 'survey' ? 'Microdata' : ucfirst($project['type'])) : '';
$date_str    = date("F j, Y", date("U"));

// Logo HTML (mPDF uses absolute file paths for images)
$logo_html = '';
if (!empty($logo_path) && file_exists($logo_path)) {
    $logo_html = '<img src="' . htmlspecialchars($logo_path) . '" style="max-height:80px;max-width:250px;" />';
}
?>

<?php if ($design === 'minimal'): ?>
<!-- MINIMAL DESIGN: Clean layout with thin accent line -->

<?php if ($logo_html): ?>
<div style="padding:15px 20px;">
    <?php echo $logo_html; ?>
</div>
<?php endif; ?>

<div style="border-top:4px solid <?php echo htmlspecialchars($primary_color); ?>;margin:10px 20px 0 20px;"></div>

<div style="padding:20px;padding-top:300px;text-align:left;">
    <div style="font-size:3em;font-weight:bold;color:#333;">
        <?php echo $title; ?>
    </div>
</div>

<div style="padding:0 20px;">
    <div style="margin-top:10px;font-size:12pt;color:<?php echo htmlspecialchars($secondary_color); ?>;font-weight:bold;">
        <?php echo $idno; ?>
    </div>

    <div style="margin-top:8px;font-size:12pt;color:gray;">
        <?php echo t('Report generated on'); ?>: <?php echo $date_str; ?>
        <?php if ($project_type): ?>
            <div style="margin-top:10px;">Project type: <?php echo $project_type; ?></div>
        <?php endif; ?>
    </div>
</div>


<?php elseif ($design === 'modern'): ?>
<!-- MODERN DESIGN: Side stripe with centered content -->

<table width="100%" cellpadding="0" cellspacing="0" style="height:100%;">
<tr>
    <td width="50" style="background-color:<?php echo htmlspecialchars($primary_color); ?>;vertical-align:top;">&nbsp;</td>
    <td style="vertical-align:top;padding:20px;">

        <?php if ($logo_html): ?>
        <div style="margin-bottom:20px;">
            <?php echo $logo_html; ?>
        </div>
        <?php endif; ?>

        <div style="padding-top:280px;text-align:center;">
            <div style="font-size:3em;font-weight:bold;color:#333;">
                <?php echo $title; ?>
            </div>

            <div style="margin-top:15px;font-size:12pt;color:<?php echo htmlspecialchars($secondary_color); ?>;font-weight:bold;">
                <?php echo $idno; ?>
            </div>

            <div style="margin-top:10px;font-size:12pt;color:gray;">
                <?php echo t('Report generated on'); ?>: <?php echo $date_str; ?>
            </div>

            <?php if ($project_type): ?>
            <div style="margin-top:10px;font-size:12pt;color:gray;">
                Project type: <?php echo $project_type; ?>
            </div>
            <?php endif; ?>
        </div>

    </td>
</tr>
</table>


<?php else: ?>
<!-- DEFAULT DESIGN: Full-width colored banner with right-aligned title -->

<div style="width:100%;background-color:<?php echo htmlspecialchars($primary_color); ?>;">

    <?php if ($logo_html): ?>
    <div style="padding:15px;">
        <?php echo $logo_html; ?>
    </div>
    <?php endif; ?>

    <div style="padding:10px;padding-top:300px;text-align:right;font-size:3em;color:<?php echo htmlspecialchars($text_color); ?>;">
        <?php echo $title; ?>
    </div>

</div>

<div style="text-align:right">

    <div style="margin-top:20px;font-size:12pt;color:<?php echo htmlspecialchars($secondary_color); ?>;font-weight:bold;">
        <?php echo $idno; ?>
    </div>

    <div style="margin-top:5px;font-size:12pt;color:gray;">
        <?php echo t('Report generated on'); ?>: <?php echo $date_str; ?>
        <?php if ($project_type): ?>
        <div style="margin-top:15px;">Project type: <?php echo $project_type; ?></div>
        <?php endif; ?>
    </div>

    <div style="margin-top:50px;font-size:12pt;color:gray;">
    </div>

</div>

<?php endif; ?>
