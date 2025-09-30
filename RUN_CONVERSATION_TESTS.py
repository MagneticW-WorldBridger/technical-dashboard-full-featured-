#!/usr/bin/env python3
"""
🚀 CONVERSATION TEST RUNNER
Run all conversation tests and generate report
"""

import asyncio
import json
from datetime import datetime
from loft-chat-chingon.conversational_testing_framework import ConversationTester

async def main():
    """Run complete conversation testing suite"""
    print("🧪 WOODSTOCK CONVERSATIONAL TESTING FRAMEWORK")
    print("=" * 60)
    
    tester = ConversationTester()
    results = await tester.run_all_tests()
    
    # Generate test report
    report = {
        "test_run_date": datetime.now().isoformat(),
        "summary": {
            "total_tests": results["total_tests"],
            "passed": results["passed"], 
            "failed": results["failed"],
            "errors": results["errors"],
            "success_rate": results["passed"] / results["total_tests"] * 100
        },
        "discourse_quality": results["overall_quality"],
        "detailed_results": results["test_results"]
    }
    
    # Save report
    with open("conversation_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📊 FINAL RESULTS:")
    print(f"   Success Rate: {report['summary']['success_rate']:.1f}%")
    print(f"   Discourse Quality Average: {sum(results['overall_quality'].values())/len(results['overall_quality']):.2f}")
    print(f"   Report saved: conversation_test_report.json")
    
    # Quick validation for meeting
    if report['summary']['success_rate'] >= 80:
        print("🎯 SYSTEM READY FOR DEMO!")
    else:
        print("⚠️ Some tests need attention before demo")

if __name__ == "__main__":
    asyncio.run(main())

