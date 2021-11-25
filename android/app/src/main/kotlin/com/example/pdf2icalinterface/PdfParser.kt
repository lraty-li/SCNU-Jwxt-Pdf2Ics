package PdfParserPackage

import android.content.Context
import android.graphics.Path
import android.graphics.Path.FillType
import android.graphics.PointF
import android.os.Handler
import android.os.Looper
import com.tom_roush.pdfbox.contentstream.PDFGraphicsStreamEngine
import com.tom_roush.pdfbox.cos.COSName
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.graphics.image.PDImage
import com.tom_roush.pdfbox.text.PDFTextStripper
import com.tom_roush.pdfbox.text.TextPosition
import com.tom_roush.pdfbox.util.PDFBoxResourceLoader
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import java.io.File
import kotlin.concurrent.thread

class PdfParser(flutterEngine: FlutterEngine, applicationContext: Context) :
    MethodChannel.MethodCallHandler {
  private val CHANNEL_PARSER = "pdf_parser"
  init {
    val channel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_PARSER)

    channel.setMethodCallHandler(this)
    PDFBoxResourceLoader.init(applicationContext)
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    // code from flutter-pdf-text
    // https://github.com/AlessioLuciani/flutter-pdf-text
    thread(start = true) {
      when (call.method) {
        "initDoc" -> {
          val args = call.arguments as Map<*, *>
          val path = args["path"] as String
          val password = args["password"] as String
          initDoc(result, path, password)
        }
        "getDocText" -> {
          val args = call.arguments as Map<*, *>
          val path = args["path"] as String

          @Suppress("UNCHECKED_CAST")
          val missingPagesNumbers = args["missingPagesNumbers"] as List<Int>
          val password = args["password"] as String
          getDocText(result, path, missingPagesNumbers, password)
        }
        else -> {
          Handler(Looper.getMainLooper()).post { result.notImplemented() }
        }
      }
    }
  }

  /** Initializes the PDF document and returns some information into the channel. */
  private fun initDoc(result: Result, path: String, password: String) {
    getDoc(result, path, password)?.use { doc ->
      // Getting the length of the PDF document in pages.
      val length = doc.numberOfPages

      val info = doc.documentInformation

      var creationDate: String? = null
      if (info.creationDate != null) {
        creationDate = info.creationDate.time.toString()
      }
      var modificationDate: String? = null
      if (info.modificationDate != null) {
        modificationDate = info.modificationDate.time.toString()
      }
      val data =
          hashMapOf<String, Any>(
              "length" to length,
              "info" to
                  hashMapOf(
                      "author" to info.author,
                      "creationDate" to creationDate,
                      "modificationDate" to modificationDate,
                      "creator" to info.creator,
                      "producer" to info.producer,
                      "keywords" to splitKeywords(info.keywords),
                      "title" to info.title,
                      "subject" to info.subject
                  )
          )
      doc.close()
      Handler(Looper.getMainLooper()).post { result.success(data) }
    }
  }

  /** Splits a string of keywords into a list of strings. */
  private fun splitKeywords(keywordsString: String?): List<String>? {
    if (keywordsString == null) {
      return null
    }
    val keywords = keywordsString.split(",").toMutableList()
    for (i in keywords.indices) {
      var keyword = keywords[i]
      keyword = keyword.dropWhile { it == ' ' }
      keyword = keyword.dropLastWhile { it == ' ' }
      keywords[i] = keyword
    }
    return keywords
  }


  /**
   * Gets the text of the entire document. In order to improve the performance, it only retrieves
   * the pages that are currently missing.
   */
  private fun getDocText(
      result: Result,
      path: String,
      missingPagesNumbers: List<Int>,
      password: String
  ) {
    getDoc(result, path, password)?.use { doc ->
      val missingPagesTexts = arrayListOf<String>()

      //user custom stripper
      val stripper = PDFTextStripperOR()
      missingPagesNumbers.forEach {
        stripper.startPage = it
        stripper.endPage = it
        missingPagesTexts.add(stripper.getText(doc))
      }
      doc.close()
      Handler(Looper.getMainLooper()).post { result.success(missingPagesTexts) }
    }
  }

  /** Gets a PDF document, given its path. */
  private fun getDoc(result: Result, path: String, password: String = ""): PDDocument? {
    return try {
      PDDocument.load(File(path), password)
    } catch (e: Exception) {
      Handler(Looper.getMainLooper()).post {
        result.error(
            "INVALID_PATH",
            "File path or password (in case of encrypted document) is invalid",
            null
        )
      }
      null
    }
  }
}

class PDFTextStripperOR : PDFTextStripper() {

  override fun writeString(sstring: String, textPositions: List<TextPosition>) {
    val word = StringBuilder()
    /// 将单词的第一个字符的坐标做为词的坐标
    // var sumX=textPositions[0].getXDirAdj();
    // var sumY=textPositions[0].getYDirAdj();
    var sumX = textPositions[0].getX()
    var sumY = textPositions[0].getY()
    // writeString(string);
    for (text in textPositions) {

      word.append(text.getUnicode())
    }
    output.write("{\"x\":\"" + sumX + "\",\"y\":\"" + sumY + "\",\"str\":\"" + word + "\"},")
  }
}


// 提取"线"坐标
// 在 appendRectangle 收集
// 使用：
// var Engine = LineCatcher( /*丢个空页进行初始化*/PDPage() );
// Engine.processPage(doc.getPage(0))
// println(Engine.pointList)
//TODO 附上链接

/*
class LineCatcher(page: PDPage?) : PDFGraphicsStreamEngine(page) {
  private val linePath: Path = Path()
  private val currentPoint = PointF(1F, 1F)
  private var clipWindingRule = Path.FillType.EVEN_ODD
  val pointList: List<PointF> = listOf()
  
  override fun shadingFill(cosn: COSName) {}
  override fun drawImage(p0: PDImage) {}

  override fun moveTo(x: Float, y: Float) {
    linePath.moveTo(x, y)
    println("moveTo")
  }

  override fun clip(p0: Path.FillType) {
    clipWindingRule = p0
    println("clip")
  }

  override fun fillPath(p0: Path.FillType) {
    linePath.reset()
    println("fillPath")
  }

  override fun endPath() {

    //   if (clipWindingRule != -1) {
    //     linePath.setWindingRule(clipWindingRule)
    //     graphicsState.intersectClippingPath(linePath)
    //     clipWindingRule = -1
    // }
    linePath.reset()

    println("endPath")
  }

  override fun closePath() {
    linePath.close()
    println("closePath")
  }

  override fun fillAndStrokePath(p0: Path.FillType) {
    linePath.reset()
  }

  override fun getCurrentPoint(): PointF {
    return currentPoint
    // return linePath.getCurrentPoint()
  }

  override fun lineTo(x: Float, y: Float) {
    linePath.lineTo(x, y)
    println("lineTo")
  }

  override fun strokePath() {
    // do stuff
    // println(linePath.getBounds2D())
    // println("strokePath")
    linePath.reset()
  }

  override fun appendRectangle(p0: PointF, p1: PointF, p2: PointF, p3: PointF) {
    pointList.plus(listOf(p0, p1, p2, p3))
    // println("appendRectangle")
    println("point 0 $p0")
    println("point 1 $p1")
    println("point 2 $p2")
    println("point 3 $p3")
    // to ensure that the path is created in the right direction, we have to create
    // it by combining single lines instead of creating a simple rectangle
    linePath.moveTo(p0.x, p0.y)
    linePath.lineTo(p1.x, p1.y)
    linePath.lineTo(p2.x, p2.y)
    linePath.lineTo(p3.x, p3.y)

    // close the subpath instead of adding the last line so that a possible set line
    // cap style isn't taken into account at the "beginning" of the rectangle
    linePath.close()
  }

  override fun curveTo(x1: Float, y1: Float, x2: Float, y2: Float, x3: Float, y3: Float) {
    currentPoint.x = x1
    currentPoint.y = y1
    linePath.cubicTo(x1, y1, x2, y2, x3, y3)
    println("curveTo")
  }
}
*/
