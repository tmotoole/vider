<?php

require_once("../../redcap_connect.php");

$pid = $_GET['pid'];

if (isset($_POST['submit'])) {
	$formValue = "";
	if (($_POST['instrument'] != "") && ($_POST['instrument'] != "all___all")) {
		$formValue = "&form=".$_POST['instrument'];
	}
	$eventValue = "";
	if (($_POST['event'] != "") && ($_POST['event'] != "all___all")) {
		$eventValue = "&event=".$_POST['event'];
	}
	header("Location: public_html?pid=$pid".$formValue.$eventValue);
} else {
	$instruments = \REDCap::getInstrumentNames();

	$isLong = \REDCap::isLongitudinal();
	if ($isLong) {
		$events = \REDCap::getEventNames(false);
	}

	?>
<style>
body { font-family: '"Helvetica Neue",Helvetica,Arial,sans-serif;' }
h1,h2,h3 { text-align: center; }
</style>
	<?php

	echo "<h1>ViDER Configuration</h1>";
	echo "<h2>".\REDCap::getProjectTitle()."</h2>";
	$style = "";
	if ($isLong) {
		$style = "width: 50%;";
	}
	echo "<form action='index.php?pid=$pid' method='POST'>";
	echo "<table style='margin-left: auto; margin-right: auto;'><tr><td style='$width'>";
	echo "<h3>Instruments</h3>";
	echo "<radio name='instrument' value='all___all' selected> All<br>";
	$instrList = array();
	foreach ($instruments as $name => $label) {
		$instrList[] = "<radio name='instrument' value='$name'> $label";
	}
	echo implode("<br>", $instrList);
	echo "</td>";
	if ($isLong) {
		echo "<td style='width: 50%';>";
		echo "<h3>Events</h3>";
		echo "<radio name='event' value='all___all' selected> All<br>";
		$eventList = array();
		foreach ($events as $label => $event_id) {
			$eventList[] = "<radio name='event' value='$event_id'> $label";
		}
		echo implode("<br>", $eventList);
		echo "</td>";
	}
	echo "</tr>";
	echo "<tr>";
	$colspan = "";
	if ($isLong) {
		$colspan = "colspan='2'";
	}
	echo "<td style='text-align: center;' $colspan><input type='submit' name='submit' value='Go!'></td>";
	echo "</tr>";
	echo "</table>";
	echo "</form>";
}
